/** Rosa semi-aberta — pétalas em camadas sobrepostas */
export default function RosaSemiAberta({
  size = 48,
  className = "",
  opacity = 1,
}: {
  size?: number;
  className?: string;
  opacity?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{ opacity }}
    >
      {/* Sépalas (base verde-rosada) */}
      {[0, 72, 144, 216, 288].map((a, i) => (
        <ellipse
          key={`sep-${i}`}
          cx="50" cy="72"
          rx="5" ry="14"
          fill="#C4776A"
          opacity="0.45"
          transform={`rotate(${a} 50 50)`}
        />
      ))}
      {/* Pétalas externas — camada 1 */}
      {[0, 51, 102, 153, 204, 255, 306].map((a, i) => (
        <ellipse
          key={`p1-${i}`}
          cx="50" cy="30"
          rx="10" ry="20"
          fill="#EDA090"
          opacity="0.75"
          transform={`rotate(${a} 50 50)`}
        />
      ))}
      {/* Pétalas médias — camada 2 */}
      {[25, 85, 145, 205, 265, 325].map((a, i) => (
        <ellipse
          key={`p2-${i}`}
          cx="50" cy="36"
          rx="9" ry="16"
          fill="#E07A68"
          opacity="0.8"
          transform={`rotate(${a} 50 50)`}
        />
      ))}
      {/* Pétalas internas — camada 3 */}
      {[0, 72, 144, 216, 288].map((a, i) => (
        <ellipse
          key={`p3-${i}`}
          cx="50" cy="41"
          rx="7" ry="12"
          fill="#C4776A"
          opacity="0.9"
          transform={`rotate(${a} 50 50)`}
        />
      ))}
      {/* Miolo */}
      <circle cx="50" cy="50" r="9" fill="#A85E52" />
      <circle cx="50" cy="50" r="5" fill="#8B3A35" />
      {/* Brilho central */}
      <ellipse cx="47" cy="47" rx="3" ry="2" fill="#EDA090" opacity="0.4" />
    </svg>
  );
}
