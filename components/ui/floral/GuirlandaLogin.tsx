/**
 * Guirlanda circular estilo logo Casa Flor:
 * — círculo fino rose
 * — flores densas no arco inferior direito (4h–8h)
 * — galhos delicados no arco superior esquerdo
 * — rosas semi-abertas misturadas com margaridas
 */
export default function GuirlandaLogin({ size = 380 }: { size?: number }) {
  const cx = 190, cy = 190, r = 155;

  // Posição polar → cartesiana
  function pos(deg: number, rr = r): [number, number] {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [cx + rr * Math.cos(rad), cy + rr * Math.sin(rad)];
  }

  return (
    <svg
      width={size} height={size}
      viewBox="0 0 380 380"
      className="pointer-events-none select-none"
    >
      {/* ── Círculo fino ── */}
      <circle cx={cx} cy={cy} r={r}
        fill="none" stroke="#C4776A" strokeWidth="1.2" opacity="0.55" />

      {/* ══ ARCO SUPERIOR ESQUERDO (300°–60°) — galhos leves ══ */}
      {/* Galho no topo esquerdo */}
      {[
        ["M60 105 Q38 78 28 52", "#C4776A", 1.4],
        ["M45 82 Q28 68 18 52", "#C4776A", 1.0],
        ["M52 92 Q35 75 26 58", "#C4776A", 0.9],
      ].map(([d, s, w], i) => (
        <path key={i} d={d as string} stroke={s as string} strokeWidth={w as number}
          fill="none" strokeLinecap="round" opacity="0.75" />
      ))}
      {/* Brotinhos topo esquerdo */}
      {[[28, 52], [18, 52], [26, 58], [20, 68]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x},${y})`}>
          <ellipse cx="0" cy="-6" rx="3.5" ry="6" fill="#EDA090" opacity="0.8" />
          <ellipse cx="0" cy="-5" rx="2" ry="4" fill="#F5C4B8" opacity="0.9" />
        </g>
      ))}

      {/* Galho topo direito */}
      {[
        ["M300 108 Q322 80 336 55", "#C4776A", 1.4],
        ["M316 88 Q334 72 342 56", "#C4776A", 1.0],
        ["M322 96 Q338 78 344 62", "#C4776A", 0.9],
      ].map(([d, s, w], i) => (
        <path key={i} d={d as string} stroke={s as string} strokeWidth={w as number}
          fill="none" strokeLinecap="round" opacity="0.75" />
      ))}
      {[[336, 55], [342, 56], [344, 62], [348, 72]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x},${y})`}>
          <ellipse cx="0" cy="-6" rx="3.5" ry="6" fill="#EDA090" opacity="0.8" />
          <ellipse cx="0" cy="-5" rx="2" ry="4" fill="#F5C4B8" opacity="0.85" />
        </g>
      ))}

      {/* ══ ARCO INFERIOR DIREITO (60°–240°) — flores densas ══ */}

      {/* Galhos conectores ao longo do arco */}
      <path d="M340 240 Q356 268 355 300 Q354 330 335 352" stroke="#C4776A" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.65"/>
      <path d="M335 352 Q310 368 285 370 Q255 372 228 360" stroke="#C4776A" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.65"/>
      <path d="M336 248 Q348 258 350 272" stroke="#C4776A" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.5"/>
      <path d="M338 355 Q348 348 352 338" stroke="#C4776A" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.5"/>
      <path d="M228 360 Q216 352 210 342" stroke="#C4776A" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.5"/>

      {/* ── Margarida grande ~2h ── */}
      <FlowerGroup type="margarida" cx={336} cy={188} r={28} rot={-15} />

      {/* ── Rosa semi-aberta ~3h ── */}
      <FlowerGroup type="rosa" cx={348} cy={235} r={24} rot={10} />

      {/* ── Margarida ~4h ── */}
      <FlowerGroup type="margarida" cx={345} cy={285} r={26} rot={30} c1="#F5C4B8" />

      {/* ── Rosa grande ~5h ── */}
      <FlowerGroup type="rosa" cx={326} cy={335} r={30} rot={50} />

      {/* ── Margarida ~5:30h ── */}
      <FlowerGroup type="margarida" cx={292} cy={362} r={22} rot={65} />

      {/* ── Rosa média ~6:30h ── */}
      <FlowerGroup type="rosa" cx={250} cy={372} r={22} rot={85} c1="#F5C4B8" />

      {/* ── Margarida ~7h ── */}
      <FlowerGroup type="margarida" cx={212} cy={358} r={20} rot={100} />

      {/* Brotinhos extras */}
      {[
        [352, 210], [350, 260], [352, 310], [316, 352], [268, 375],
        [230, 368], [206, 348],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x},${y})`}>
          <ellipse cx="0" cy="-7" rx="3.8" ry="7" fill="#EDA090" opacity="0.75" />
          <ellipse cx="0" cy="-6" rx="2.2" ry="4.5" fill="#F5C4B8" opacity="0.85" />
        </g>
      ))}

      {/* Folhinhas decorativas */}
      {[
        [342, 218, 10], [344, 268, 28], [336, 318, 45],
        [310, 348, 60], [268, 368, 80], [232, 364, 95],
      ].map(([x, y, rot], i) => (
        <ellipse key={i} cx={x} cy={y} rx={5} ry={10}
          fill="#C4776A" opacity={0.3}
          transform={`rotate(${rot} ${x} ${y})`} />
      ))}
    </svg>
  );
}

/* ── Margarida SVG inline ── */
function FlowerGroup({
  type, cx, cy, r, rot = 0, c1 = "#EDA090",
}: {
  type: "margarida" | "rosa";
  cx: number; cy: number; r: number; rot?: number; c1?: string;
}) {
  return (
    <g transform={`translate(${cx},${cy}) rotate(${rot})`}>
      {type === "margarida" ? <MargaridaSVG r={r} c1={c1} /> : <RosaSVG r={r} />}
    </g>
  );
}

function MargaridaSVG({ r, c1 = "#EDA090" }: { r: number; c1?: string }) {
  const petals = 13;
  return (
    <>
      {Array.from({ length: petals }).map((_, i) => (
        <ellipse key={i} cx="0" cy={-(r * 1.8)}
          rx={r * 0.36} ry={r * 0.92}
          fill={c1}
          transform={`rotate(${(i * 360) / petals})`}
        />
      ))}
      <circle cx="0" cy="0" r={r * 0.68} fill="#E07A50" />
      <circle cx="0" cy="0" r={r * 0.44} fill="#C4573A" />
      {Array.from({ length: 7 }).map((_, i) => {
        const rad = ((i * 360) / 7) * (Math.PI / 180);
        return (
          <circle key={i}
            cx={r * 0.28 * Math.cos(rad)}
            cy={r * 0.28 * Math.sin(rad)}
            r={r * 0.09} fill="#EDA090" />
        );
      })}
    </>
  );
}

function RosaSVG({ r }: { r: number }) {
  return (
    <>
      {[0, 72, 144, 216, 288].map((a, i) => (
        <ellipse key={`s${i}`} cx="0" cy={r * 0.82}
          rx={r * 0.22} ry={r * 0.46} fill="#C4776A" opacity="0.38"
          transform={`rotate(${a})`} />
      ))}
      {[0, 51, 102, 153, 204, 255, 306].map((a, i) => (
        <ellipse key={`pe${i}`} cx="0" cy={-(r * 0.52)}
          rx={r * 0.37} ry={r * 0.62} fill="#EDA090" opacity="0.75"
          transform={`rotate(${a})`} />
      ))}
      {[25, 85, 145, 205, 265, 325].map((a, i) => (
        <ellipse key={`pm${i}`} cx="0" cy={-(r * 0.4)}
          rx={r * 0.32} ry={r * 0.5} fill="#E07A68" opacity="0.85"
          transform={`rotate(${a})`} />
      ))}
      {[0, 72, 144, 216, 288].map((a, i) => (
        <ellipse key={`pi${i}`} cx="0" cy={-(r * 0.26)}
          rx={r * 0.25} ry={r * 0.36} fill="#C4776A" opacity="0.9"
          transform={`rotate(${a})`} />
      ))}
      <circle cx="0" cy="0" r={r * 0.2} fill="#A85E52" />
      <circle cx="0" cy="0" r={r * 0.11} fill="#8B3A35" />
    </>
  );
}
