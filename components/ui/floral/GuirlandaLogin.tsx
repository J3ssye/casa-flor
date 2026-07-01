/**
 * Guirlanda Casa Flor — arco floral vetorizado (public/arco-flor.svg).
 * Vem da arte original do logo: fundo e a escrita "Casa Flor" foram removidos,
 * mantendo apenas o anel + as flores. O texto fica por conta do formulário (React).
 */
export default function GuirlandaLogin({ size = 400 }: { size?: number }) {
  return (
    <img
      src="/arco-flor.svg"
      alt=""
      width={size}
      height={size}
      className="pointer-events-none select-none"
      draggable={false}
    />
  );
}
