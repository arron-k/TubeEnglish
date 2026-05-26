import Skeleton from '@/components/common/Skeleton';

const WIDTHS = ['w-3/4', 'w-full', 'w-2/3', 'w-5/6', 'w-full', 'w-3/4', 'w-4/5', 'w-2/3'];

export default function CaptionSkeleton() {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl bg-white p-3 shadow-sm dark:bg-gray-900" aria-label="자막 로딩 중">
      {WIDTHS.map((w, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <Skeleton className={`h-3.5 ${w}`} />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}
