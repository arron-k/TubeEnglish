import UrlInputBar from '@/components/common/UrlInputBar';

const SAMPLE_VIDEOS = [
  { label: 'TED Talk', videoId: 'arj7oStGLkU' },
  { label: 'CNN News', videoId: 'dQw4w9WgXcQ' },
  { label: 'Crash Course', videoId: '8AHCfZTRGiI' },
];

const FEATURES = [
  {
    icon: '🎬',
    title: '자막 동기화',
    desc: '영상과 자막이 실시간으로 함께 움직여요',
  },
  {
    icon: '🎙️',
    title: '쉐도잉 연습',
    desc: '말하는 순간 발음을 즉시 분석해줘요',
  },
  {
    icon: '🤖',
    title: 'AI 튜터',
    desc: '틀린 표현을 바로잡고 함께 대화해요',
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ login_required?: string }>;
}) {
  const params = await searchParams;
  const loginRequired = params.login_required === '1';

  return (
    <main className="flex flex-1 flex-col">
      {loginRequired && (
        <div className="bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          로그인 후 이용할 수 있어요. 우측 상단에서 Google 로그인해주세요.
        </div>
      )}

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-20">
        <div className="w-full max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
            AI 영어 학습의 새로운 방법
          </div>

          <h1 className="mb-4 text-5xl font-bold tracking-tight text-gray-900 dark:text-white md:text-6xl">
            Tube
            <span className="text-brand-600">English</span>
          </h1>

          <p className="mb-10 text-lg text-gray-500 dark:text-gray-400">
            유튜브 영상을 보고, 따라 말하고, AI와 대화하며
            <br className="hidden sm:block" />
            실전 영어를 가장 빠르게 익혀보세요.
          </p>

          <UrlInputBar size="large" />

          <p className="mt-3 text-xs text-gray-400 dark:text-gray-600">
            예시: youtube.com/watch?v=... 또는 youtu.be/...
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-gray-100 bg-gray-50 px-4 py-16 dark:border-gray-800 dark:bg-gray-900/40">
        <div className="mx-auto max-w-3xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800"
              >
                <div className="mb-3 text-3xl">{f.icon}</div>
                <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
