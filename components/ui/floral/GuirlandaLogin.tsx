/**
 * Guirlanda circular estilo logo Casa Flor:
 * — anel fino terracota, aberto no arco superior esquerdo
 * — galhos delicados no topo
 * — arco inferior direito denso de flores cosmos rosa (pétalas largas, miolo dourado)
 * — buquês de botões rosa-velho e caules finos misturados
 */
export default function GuirlandaLogin({ size = 380 }: { size?: number }) {
  const cx = 190, cy = 190, r = 155;

  // Posição polar (0° = topo, sentido horário) → cartesiana
  function pos(deg: number, rr = r): [number, number] {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [cx + rr * Math.cos(rad), cy + rr * Math.sin(rad)];
  }

  const STEM = "#B5654D";

  // ── Flores cosmos ao longo do arco inferior direito (90°→235°) ──
  const cosmos: { a: number; rr: number; s: number; c1: string; c2: string }[] = [
    { a: 90,  rr: 150, s: 28, c1: "#ECA3B0", c2: "#F4C6CE" },
    { a: 116, rr: 153, s: 35, c1: "#E590A0", c2: "#F0B7C1" },
    { a: 143, rr: 150, s: 41, c1: "#EFB1BC", c2: "#F7D2D8" },
    { a: 165, rr: 147, s: 43, c1: "#E68FA0", c2: "#F1BAC4" },
    { a: 186, rr: 151, s: 33, c1: "#ECA3B0", c2: "#F4C6CE" },
    { a: 210, rr: 152, s: 24, c1: "#E590A0", c2: "#F0B7C1" },
    { a: 233, rr: 155, s: 17, c1: "#EFB1BC", c2: "#F7D2D8" },
  ];

  // ── Buquês de botõezinhos (entre/fora das flores) ──
  const buds: { a: number; rr: number; s: number }[] = [
    { a: 78,  rr: 157, s: 7 },
    { a: 103, rr: 159, s: 8 },
    { a: 130, rr: 161, s: 8 },
    { a: 154, rr: 162, s: 9 },
    { a: 176, rr: 162, s: 9 },
    { a: 199, rr: 160, s: 8 },
    { a: 222, rr: 158, s: 7 },
    { a: 246, rr: 156, s: 6 },
  ];

  return (
    <svg
      width={size} height={size}
      viewBox="0 0 380 380"
      className="pointer-events-none select-none"
    >
      {/* ── Anel fino (aberto no topo esquerdo) ── */}
      <path
        d={`M ${pos(312)[0]} ${pos(312)[1]}
            A ${r} ${r} 0 1 1 ${pos(305)[0]} ${pos(305)[1]}`}
        fill="none" stroke={STEM} strokeWidth="1.2" opacity="0.6" strokeLinecap="round" />

      {/* ══ GALHOS LEVES NO TOPO ══ */}
      {[
        ["M60 105 Q38 78 28 52", 1.4],
        ["M45 82 Q28 68 18 52", 1.0],
        ["M52 92 Q35 75 26 58", 0.9],
        ["M300 108 Q322 80 336 55", 1.4],
        ["M316 88 Q334 72 342 56", 1.0],
        ["M322 96 Q338 78 344 62", 0.9],
      ].map(([d, w], i) => (
        <path key={i} d={d as string} stroke={STEM} strokeWidth={w as number}
          fill="none" strokeLinecap="round" opacity="0.7" />
      ))}
      {[[28, 52], [18, 52], [26, 58], [20, 68], [336, 55], [342, 56], [344, 62], [348, 72]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x},${y})`}>
          <ellipse cx="0" cy="-6" rx="3.2" ry="5.5" fill="#E89AA6" opacity="0.8" />
          <ellipse cx="0" cy="-5" rx="1.8" ry="3.5" fill="#F4C6CE" opacity="0.9" />
        </g>
      ))}

      {/* ══ Caules finos seguindo o arco inferior ══ */}
      <path d="M338 232 Q356 270 354 308 Q352 342 330 360" stroke={STEM} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.55" />
      <path d="M330 360 Q300 376 268 376 Q232 376 204 360" stroke={STEM} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.55" />
      <path d="M345 250 Q352 262 351 278" stroke={STEM} strokeWidth="1.0" fill="none" strokeLinecap="round" opacity="0.45" />
      <path d="M204 360 Q192 350 188 336" stroke={STEM} strokeWidth="1.0" fill="none" strokeLinecap="round" opacity="0.45" />

      {/* Folhinhas suaves ao longo do arco */}
      {[
        [344, 215, 8], [350, 270, 28], [340, 320, 48],
        [312, 352, 64], [266, 372, 84], [226, 364, 100],
      ].map(([x, y, rot], i) => (
        <ellipse key={i} cx={x} cy={y} rx={4.5} ry={9}
          fill={STEM} opacity={0.28}
          transform={`rotate(${rot} ${x} ${y})`} />
      ))}

      {/* ══ Buquês de botões ══ */}
      {buds.map((b, i) => {
        const [x, y] = pos(b.a, b.rr);
        return (
          <g key={i} transform={`translate(${x},${y}) rotate(${b.a})`}>
            <BudCluster s={b.s} />
          </g>
        );
      })}

      {/* ══ Flores cosmos ══ */}
      {cosmos.map((f, i) => {
        const [x, y] = pos(f.a, f.rr);
        return (
          <g key={i} transform={`translate(${x},${y}) rotate(${f.a * 0.5})`}>
            <CosmosSVG r={f.s} c1={f.c1} c2={f.c2} />
          </g>
        );
      })}
    </svg>
  );
}

/* ── Flor cosmos: 8 pétalas largas com tip levemente recortado + miolo dourado ── */
function CosmosSVG({ r, c1, c2 }: { r: number; c1: string; c2: string }) {
  const petals = 8;
  const L = r * 1.18;
  const w = r * 0.42;
  const petal = `
    M 0 0
    C ${-w} ${-L * 0.42}, ${-w} ${-L * 0.86}, ${-w * 0.42} ${-L * 0.99}
    Q 0 ${-L * 0.9} ${w * 0.42} ${-L * 0.99}
    C ${w} ${-L * 0.86}, ${w} ${-L * 0.42}, 0 0
    Z`;
  return (
    <>
      {Array.from({ length: petals }).map((_, i) => (
        <g key={i} transform={`rotate(${(i * 360) / petals})`}>
          <path d={petal} fill={c1} />
          {/* nervura clara central */}
          <path
            d={`M 0 ${-L * 0.05} C ${-w * 0.28} ${-L * 0.45}, ${-w * 0.24} ${-L * 0.82}, 0 ${-L * 0.92}
                C ${w * 0.24} ${-L * 0.82}, ${w * 0.28} ${-L * 0.45}, 0 ${-L * 0.05} Z`}
            fill={c2} opacity="0.65" />
        </g>
      ))}
      {/* miolo dourado */}
      <circle r={r * 0.34} fill="#E8B24E" />
      <circle r={r * 0.22} fill="#D89A36" />
      {Array.from({ length: 8 }).map((_, i) => {
        const rad = ((i * 360) / 8) * (Math.PI / 180);
        return (
          <circle key={i}
            cx={r * 0.22 * Math.cos(rad)}
            cy={r * 0.22 * Math.sin(rad)}
            r={r * 0.05} fill="#B97A28" />
        );
      })}
      <circle r={r * 0.07} fill="#C98A2E" />
    </>
  );
}

/* ── Buquê de pequenos botões rosa-velho ── */
function BudCluster({ s = 8 }: { s?: number }) {
  const dots: [number, number, number][] = [
    [0, 0, 1], [-s * 1.0, -s * 0.5, 0.85], [s * 0.9, -s * 0.6, 0.85],
    [-s * 0.3, -s * 1.3, 0.8], [s * 0.5, -s * 1.5, 0.75], [-s * 1.3, -s * 1.4, 0.7],
  ];
  return (
    <>
      {dots.map(([x, y, sc], i) => (
        <g key={i} transform={`translate(${x},${y}) scale(${sc})`}>
          {[0, 72, 144, 216, 288].map((a, j) => (
            <ellipse key={j} cx="0" cy={-s * 0.55} rx={s * 0.3} ry={s * 0.55}
              fill="#D98592" opacity="0.85" transform={`rotate(${a})`} />
          ))}
          <circle r={s * 0.3} fill="#E8B24E" />
        </g>
      ))}
    </>
  );
}
