export default function Margarida({
  size = 36,
  className = "",
  opacity = 1,
}: {
  size?: number;
  className?: string;
  opacity?: number;
}) {
  const petals = 13;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{ opacity }}
    >
      {/* Pétalas */}
      {Array.from({ length: petals }).map((_, i) => (
        <ellipse
          key={i}
          cx="50"
          cy="16"
          rx="5.5"
          ry="18"
          fill="#F5C4B8"
          transform={`rotate(${(i * 360) / petals} 50 50)`}
        />
      ))}
      {/* Centro — aro externo */}
      <circle cx="50" cy="50" r="14" fill="#E07A50" />
      {/* Centro — núcleo */}
      <circle cx="50" cy="50" r="10" fill="#C4573A" />
      {/* Pontinhos do centro */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * 360) / 8;
        const rad = (a * Math.PI) / 180;
        return (
          <circle
            key={i}
            cx={50 + 5.5 * Math.cos(rad)}
            cy={50 + 5.5 * Math.sin(rad)}
            r="1.8"
            fill="#EDA090"
          />
        );
      })}
    </svg>
  );
}
