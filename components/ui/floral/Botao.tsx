/** Botão floral (broto pequeno no galho) */
export default function Botao({
  size = 14,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size * 1.6}
      viewBox="0 0 20 32"
      className={className}
    >
      {/* Haste */}
      <line x1="10" y1="32" x2="10" y2="14" stroke="#C4776A" strokeWidth="1.5" strokeLinecap="round" />
      {/* Sépala esquerda */}
      <path d="M10 18 Q4 14 5 8" stroke="#C4776A" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Sépala direita */}
      <path d="M10 18 Q16 14 15 8" stroke="#C4776A" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Pétala */}
      <ellipse cx="10" cy="8" rx="5" ry="8" fill="#EDA090" />
      <ellipse cx="10" cy="10" rx="3" ry="5" fill="#F5C4B8" />
    </svg>
  );
}
