import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { toKstDateString, kstTodayString } from '@/lib/utils/dateKst';
import StatCard from '@/components/dashboard/StatCard';
import ActivityHeatmap from '@/components/dashboard/ActivityHeatmap';
import DashboardRefresher from '@/components/dashboard/DashboardRefresher';

export const dynamic = 'force-dynamic';

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

function streakMessage(days: number, learnedToday: boolean): string {
  if (days === 0) return '오늘 첫 학습을 시작해보세요!';
  if (!learnedToday) return `${days}일 연속! 오늘 학습을 안 하면 기록이 끊겨요 ⚠️`;
  if (days === 1) return '오늘 학습했어요. 내일도 이어가요!';
  if (days < 7) return `${days}일째 이어가고 있어요. 정말 대단해요!`;
  if (days < 30) return `${days}일 연속! 꾸준함이 실력이 돼요.`;
  return `${days}일 연속!! 당신은 영어 학습 챔피언이에요! 🏆`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/?login_required=1');

  const sixteenWeeksAgo = new Date();
  sixteenWeeksAgo.setDate(sixteenWeeksAgo.getDate() - 16 * 7);

  const [userRes, logsRes] = await Promise.all([
    supabase
      .from('users')
      .select('display_name, avatar_url, streak_days, longest_streak, total_learning_minutes, last_learned_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('learning_logs')
      .select(
        'video_id, video_title, video_thumbnail_url, watched_duration, average_shadowing_score, completed_shadowing_count, ai_conversation_count, created_at'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  const userData = userRes.data;
  const allLogs = logsRes.data ?? [];

  const totalShadowing = allLogs.reduce((s, r) => s + (r.completed_shadowing_count ?? 0), 0);
  const totalAiChats = allLogs.reduce((s, r) => s + (r.ai_conversation_count ?? 0), 0);

  const sixteenWeeksAgoIso = sixteenWeeksAgo.toISOString();
  const heatmapData: Record<string, number> = {};
  allLogs.forEach((log) => {
    if (log.created_at < sixteenWeeksAgoIso) return;
    const date = toKstDateString(log.created_at);
    heatmapData[date] = (heatmapData[date] ?? 0) + (log.watched_duration ?? 0);
  });

  type RecentVideo = {
    videoId: string;
    title: string;
    thumbnail: string | null;
    totalDuration: number;
    sessionCount: number;
    latestScore: number | null;
    lastLearnedAt: string;
  };

  const videoMap = new Map<string, RecentVideo>();
  allLogs.forEach((log) => {
    const existing = videoMap.get(log.video_id);
    if (!existing) {
      videoMap.set(log.video_id, {
        videoId: log.video_id,
        title: log.video_title,
        thumbnail: log.video_thumbnail_url,
        totalDuration: log.watched_duration ?? 0,
        sessionCount: 1,
        latestScore: log.average_shadowing_score ?? null,
        lastLearnedAt: log.created_at,
      });
    } else {
      existing.totalDuration += log.watched_duration ?? 0;
      existing.sessionCount += 1;
      if (existing.latestScore == null && log.average_shadowing_score != null) {
        existing.latestScore = log.average_shadowing_score;
      }
    }
  });

  const recentVideos = [...videoMap.values()]
    .sort((a, b) => b.lastLearnedAt.localeCompare(a.lastLearnedAt))
    .slice(0, 6);

  const streakDays = userData?.streak_days ?? 0;
  const longestStreak = userData?.longest_streak ?? 0;
  const totalMinutes = userData?.total_learning_minutes ?? 0;
  const displayName = userData?.display_name ?? user.email?.split('@')[0] ?? '학습자';
  const learnedToday = userData?.last_learned_at
    ? toKstDateString(userData.last_learned_at) === kstTodayString()
    : false;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <DashboardRefresher />
      <div className="mb-8 flex items-center gap-4">
        {userData?.avatar_url ? (
          <Image
            src={userData.avatar_url}
            alt={displayName}
            width={48}
            height={48}
            className="rounded-full"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-lg font-bold text-white">
            {displayName[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            안녕하세요, {displayName}님!
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {streakMessage(streakDays, learnedToday)}
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon="🔥" label="연속 학습" value={`${streakDays}일`} highlight />
        <StatCard
          icon="📚"
          label="총 학습 시간"
          value={formatMinutes(totalMinutes)}
        />
        <StatCard icon="🎯" label="쉐도잉 횟수" value={`${totalShadowing}회`} />
        <StatCard icon="💬" label="AI 대화" value={`${totalAiChats}회`} />
      </div>

      <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {streakDays}일 연속 학습 중
            </span>
          </div>
          <span className="text-sm text-gray-400">
            최장 기록:{' '}
            <span className="font-semibold text-gray-600 dark:text-gray-300">{longestStreak}일</span>
          </span>
        </div>
        <ActivityHeatmap data={heatmapData} />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">최근 학습 영상</h2>
        </div>

        {recentVideos.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 px-6 py-12 text-center dark:border-gray-700">
            <p className="mb-2 text-4xl">🎬</p>
            <p className="text-gray-500 dark:text-gray-400">아직 학습한 영상이 없어요.</p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              첫 영상 시작하기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentVideos.map((video) => (
              <Link
                key={video.videoId}
                href={`/watch?v=${video.videoId}`}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-gray-900"
              >
                <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <Image
                    src={
                      video.thumbnail ??
                      `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`
                    }
                    alt={video.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  {video.sessionCount > 1 && (
                    <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
                      {video.sessionCount}회 학습
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p className="mb-1 line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">
                    {video.title}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{formatDate(video.lastLearnedAt)}</span>
                    <span>
                      {video.sessionCount > 1 ? '총 ' : ''}
                      {formatMinutes(Math.round(video.totalDuration / 60))}
                    </span>
                  </div>
                  {video.latestScore != null && video.latestScore > 0 && (
                    <div className="mt-2 flex items-center gap-1">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className="h-full rounded-full bg-brand-500"
                          style={{ width: `${video.latestScore}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">
                        {Math.round(video.latestScore)}%
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
