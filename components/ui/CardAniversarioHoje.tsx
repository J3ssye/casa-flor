"use client";

import { corDaModadora } from "@/lib/cores";

interface Props {
  nome: string;
  cor: string | null;
  idxCor: number;
  foto?: string | null;
  onComemorar?: () => void;
}

// [xP%, yP%, rxBall, ryBall, color, rotDeg]
const BALOES: [number, number, number, number, string, number][] = [
  // topo — cluster central
  [50,  6, 27, 33, "#D4A8B0", -4],
  [30,  2, 23, 28, "#C8909C",  8],
  [69,  3, 25, 30, "#E8C0C8", -7],
  // topo — laterais
  [14, 10, 20, 25, "#B89098", 13],
  [84,  8, 22, 27, "#C4907A",-11],
  [42, -2, 19, 24, "#D4B4A8",  5],
  [61, -3, 18, 22, "#C0A0A8", -5],
  // extremos
  [ 2,  4, 17, 22, "#E8C0C8", 16],
  [96,  3, 17, 22, "#D4A8B0",-14],
  // laterais médias
  [ 1, 36, 16, 20, "#C8909C", 19],
  [98, 33, 16, 20, "#B89098",-17],
  [ 3, 62, 14, 18, "#D4B4A8", 14],
  [96, 60, 14, 18, "#C4907A",-14],
  // baixo
  [18, 88, 18, 22, "#E8C0C8",  7],
  [80, 87, 18, 22, "#D4A8B0", -6],
  [50, 93, 16, 20, "#C8909C", -2],
];

function BaloesBackground({ W, H }: { W: number; H: number }) {
  return (
    <>
      {BALOES.map(([xP, yP, rx, ry, color, rot], i) => {
        const x = (xP / 100) * W;
        const y = (yP / 100) * H;
        return (
          <g key={i} transform={`rotate(${rot},${x},${y})`} opacity="0.82">
            {/* corpo */}
            <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={color} />
            {/* brilho */}
            <ellipse
              cx={x - rx * 0.3} cy={y - ry * 0.3}
              rx={rx * 0.28} ry={ry * 0.22}
              fill="white" opacity="0.28"
            />
            {/* nó */}
            <path
              d={`M${x - 3} ${y + ry} Q${x} ${y + ry + 8} ${x + 3} ${y + ry} Q${x} ${y + ry + 4} ${x - 3} ${y + ry}`}
              fill={color}
            />
            {/* fio ondulado */}
            <path
              d={`M${x} ${y + ry + 4} Q${x + 13} ${y + ry + 32},${x - 9} ${y + ry + 64} Q${x + 7} ${y + ry + 98},${x - 4} ${y + ry + 130}`}
              stroke={color} strokeWidth="1.2" fill="none" strokeOpacity="0.52"
            />
          </g>
        );
      })}
    </>
  );
}

export default function CardAniversarioHoje({
  nome,
  cor,
  idxCor,
  foto,
  onComemorar,
}: Props) {
  const c = corDaModadora(cor, idxCor);
  const primeiroNome = nome.split(" ")[0];

  // Dimensões do card e da Polaroid
  const CW = 280;
  const CH = 380;
  const polW = 156;
  const polPad = 8;   // lateral / topo
  const polBot = 46;  // espaço do texto embaixo
  const imgSide = polW - polPad * 2; // 140px — quadrado

  return (
    <div
      className="relative mx-auto overflow-hidden rounded-3xl shadow-2xl select-none"
      style={{
        width: `${CW}px`,
        height: `${CH}px`,
        background:
          "linear-gradient(148deg,#F2C6CC 0%,#E8B4BC 25%,#D8A0AC 55%,#C49098 80%,#B88090 100%)",
      }}
    >
      {/* ── balões SVG ── */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${CW} ${CH}`}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <BaloesBackground W={CW} H={CH} />
      </svg>

      {/* vinheta suave */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 42%,transparent 28%,rgba(150,88,96,0.22) 100%)",
        }}
      />

      {/* ── Polaroid ── */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: "12px" }}>
        <div
          style={{
            background: "white",
            padding: `${polPad}px ${polPad}px ${polBot}px`,
            width: `${polW}px`,
            transform: "rotate(-1.8deg)",
            boxShadow:
              "0 12px 40px rgba(0,0,0,0.38), 0 3px 10px rgba(0,0,0,0.18)",
          }}
        >
          {/* Área da foto / inicial */}
          <div
            style={{
              width: `${imgSide}px`,
              height: `${imgSide}px`,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {foto ? (
              <img
                src={foto}
                alt={nome}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: `linear-gradient(135deg,${c.bg} 0%,${c.swatch}99 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    backgroundColor: c.swatch,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                  }}
                >
                  <span
                    style={{
                      color: "white",
                      fontSize: "28px",
                      fontWeight: "700",
                      lineHeight: 1,
                      fontFamily: "'Dancing Script',cursive",
                    }}
                  >
                    {nome.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Texto dentro da Polaroid */}
          <div style={{ textAlign: "center", marginTop: "8px", padding: "0 4px" }}>
            <p
              className="font-script"
              style={{ fontSize: "16px", color: "#5a4040", lineHeight: 1.2, margin: 0 }}
            >
              Feliz Aniversário!
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                marginTop: "4px",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  color: "#8a6060",
                  fontWeight: "600",
                  letterSpacing: "0.04em",
                }}
              >
                {primeiroNome}
              </span>
              <span style={{ fontSize: "13px", color: "#C4907A" }}>♡</span>
            </div>
          </div>
        </div>
      </div>

      {/* botão comemorar */}
      {onComemorar && (
        <button
          onClick={onComemorar}
          className="absolute bottom-3 right-3 text-white text-xs font-medium transition-all hover:scale-105"
          style={{
            background: "rgba(255,255,255,0.22)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            borderRadius: "20px",
            padding: "4px 11px",
            border: "1px solid rgba(255,255,255,0.38)",
          }}
        >
          🌸 Comemorar
        </button>
      )}
    </div>
  );
}
