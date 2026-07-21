export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-4 pt-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-stone-200" />
        <div className="h-5 w-32 rounded bg-stone-200" />
      </div>
      <div className="flex gap-2">
        <div className="h-7 w-16 rounded-full bg-stone-200" />
        <div className="h-7 w-16 rounded-full bg-stone-200" />
        <div className="h-7 w-16 rounded-full bg-stone-200" />
      </div>
      <div className="h-11 rounded-3xl bg-stone-200" />
      <div className="h-56 rounded-3xl bg-stone-200" />
    </div>
  );
}
