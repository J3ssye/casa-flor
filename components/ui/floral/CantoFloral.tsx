/**
 * Canto decorativo com galho + margarida.
 * position: "tl" | "tr" | "bl" | "br"
 */
export default function CantoFloral({
  position = "tr",
  size = 80,
  className = "",
}: {
  position?: "tl" | "tr" | "bl" | "br";
  size?: number;
  className?: string;
}) {
  const flip = {
    tl: "scale(-1,1)",
    tr: "scale(1,1)",
    bl: "scale(-1,-1)",
    br: "scale(1,-1)",
  }[position];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      className={`pointer-events-none select-none ${className}`}
      style={{ transformOrigin: "center" }}
    >
      <g transform={`translate(40,40) ${flip} translate(-40,-40)`}>
        {/* Galho principal */}
        <path d="M80 0 Q55 15 40 40" stroke="#C4776A" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.7"/>
        {/* Galho secundário */}
        <path d="M65 5 Q50 20 42 35" stroke="#C4776A" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.6"/>
        {/* Galho terciário */}
        <path d="M72 0 Q60 12 52 28" stroke="#C4776A" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.5"/>
        {/* Brotinhos */}
        <circle cx="42" cy="18" r="3" fill="#EDA090" opacity="0.75"/>
        <circle cx="52" cy="10" r="2.5" fill="#F5C4B8" opacity="0.7"/>
        <circle cx="35" cy="30" r="2" fill="#EDA090" opacity="0.65"/>
        {/* Margarida no canto */}
        <g transform="translate(68, 8) scale(0.32)">
          <MargaridaSVG />
        </g>
        {/* Margarida pequena */}
        <g transform="translate(50, 22) scale(0.22)">
          <MargaridaSVG />
        </g>
      </g>
    </svg>
  );
}

function MargaridaSVG() {
  const petals = 13;
  return (
    <>
      {Array.from({ length: petals }).map((_, i) => (
        <ellipse
          key={i}
          cx="50" cy="14"
          rx="5.5" ry="18"
          fill="#F5C4B8"
          transform={`rotate(${(i * 360) / petals} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="15" fill="#E07A50" />
      <circle cx="50" cy="50" r="10" fill="#C4573A" />
    </>
  );
}
