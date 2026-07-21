export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-5 pt-6">
      <div className="flex items-center justify-between">
        <div className="h-9 w-9 rounded-full bg-stone-200" />
        <div className="h-5 w-28 rounded bg-stone-200" />
        <div className="h-9 w-9 rounded-full bg-stone-200" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-9 w-9 rounded-full bg-stone-200" />
        <div className="h-4 w-24 rounded bg-stone-200" />
        <div className="h-9 w-9 rounded-full bg-stone-200" />
      </div>
      <div className="h-20 rounded-3xl bg-stone-200" />
      <div className="h-36 rounded-3xl bg-stone-200" />
      <div className="h-44 rounded-3xl bg-stone-200" />
    </div>
  );
}
