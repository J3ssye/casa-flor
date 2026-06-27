export default function Card({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div className={`bg-white/80 rounded-2xl shadow-sm border border-primary-100 p-4 ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
