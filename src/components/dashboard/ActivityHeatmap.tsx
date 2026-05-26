'use client';

import { toKstDateString, kstTodayString } from '@/lib/utils/dateKst';

const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const TOTAL_WEEKS = 16;

function intensityClass(seconds: number): string {
  if (seconds === 0) return 'bg-gray-100 dark:bg-gray-800';
  if (seconds < 120) return 'bg-green-200 dark:bg-green-900';
  if (seconds < 600) return 'bg-green-400 dark:bg-green-700';
  return 'bg-green-600 dark:bg-green-500';
}

function buildWeeks(): Date[][] {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - today.getDay() - (TOTAL_WEEKS - 1) * 7);

  const weeks: Date[][] = [];
  const cur = new Date(start);
  for (let w = 0; w < TOTAL_WEEKS; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function getMonthLabels(weeks: Date[][]): (string | null)[] {
  return weeks.map((week, i) => {
    const firstDay = week[0];
    if (firstDay.getDate() <= 7) {
      const prevWeekFirstDay = i > 0 ? weeks[i - 1][0] : null;
      if (!prevWeekFirstDay || prevWeekFirstDay.getMonth() !== firstDay.getMonth()) {
        return MONTH_NAMES[firstDay.getMonth()];
      }
    }
    return null;
  });
}

export default function ActivityHeatmap({ data }: { data: Record<string, number> }) {
  const today = new Date();
  const todayStr = kstTodayString();
  const weeks = buildWeeks();
  const monthLabels = getMonthLabels(weeks);

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-1">
        <div className="mr-1 flex flex-col justify-around pt-5">
          {WEEK_DAYS.map((d, i) => (
            <span key={i} className="h-3 text-[10px] leading-3 text-gray-400">
              {i % 2 === 1 ? d : ''}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="flex gap-1">
            {monthLabels.map((label, i) => (
              <div key={i} className="w-3 text-[10px] text-gray-400">
                {label ?? ''}
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day, di) => {
                  const dateStr = toKstDateString(day);
                  const seconds = data[dateStr] ?? 0;
                  const isFuture = day > today;
                  const isToday = dateStr === todayStr;
                  const mins = Math.round(seconds / 60);
                  const tooltipLabel =
                    seconds > 0 ? `${dateStr}: ${mins}분 학습` : `${dateStr}: 미학습`;
                  return (
                    <div
                      key={di}
                      title={tooltipLabel}
                      className={`h-3 w-3 rounded-sm transition-opacity ${
                        isFuture ? 'opacity-0' : intensityClass(seconds)
                      } ${isToday ? 'ring-1 ring-brand-500 ring-offset-1 ring-offset-white dark:ring-offset-gray-900' : ''}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
        <span>적음</span>
        {['bg-gray-100 dark:bg-gray-800', 'bg-green-200 dark:bg-green-900', 'bg-green-400 dark:bg-green-700', 'bg-green-600 dark:bg-green-500'].map(
          (cls, i) => (
            <div key={i} className={`h-3 w-3 rounded-sm ${cls}`} />
          )
        )}
        <span>많음</span>
      </div>
    </div>
  );
}
