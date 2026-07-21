export default function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-3xl border border-black/5 bg-white p-4 shadow-sm ${className ?? ""}`}>
      {children}
    </div>
  );
}
