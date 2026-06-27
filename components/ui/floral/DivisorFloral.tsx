import Margarida from "./Margarida";

/** Divisor horizontal com margaridas e galhos — para separar seções */
export default function DivisorFloral({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 my-1 ${className}`}>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-primary-200" />
      <Margarida size={20} opacity={0.7} />
      <svg width="40" height="16" viewBox="0 0 40 16" className="opacity-60">
        <path d="M0 8 Q10 2 20 8 Q30 14 40 8" stroke="#C4776A" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        <circle cx="5" cy="5" r="2" fill="#EDA090"/>
        <circle cx="35" cy="11" r="2" fill="#EDA090"/>
      </svg>
      <Margarida size={20} opacity={0.7} />
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-primary-200" />
    </div>
  );
}
