export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-5 pt-6">
      <div className="h-32 rounded-3xl bg-stone-200" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-3xl bg-stone-200" />
        <div className="h-24 rounded-3xl bg-stone-200" />
      </div>
      <div className="h-12 rounded-3xl bg-stone-200" />
      <div className="flex flex-col gap-2">
        <div className="h-4 w-16 rounded bg-stone-200" />
        <div className="h-44 rounded-3xl bg-stone-200" />
      </div>
    </div>
  );
}
