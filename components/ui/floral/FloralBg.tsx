"use client";

/**
 * Fundo completamente florido — margaridas e rosas semi-abertas
 * distribuídas por toda a tela, saindo pelas bordas.
 */
export default function FloralBg() {
  return (
    <div className="pointer-events-none select-none fixed inset-0 z-0 overflow-hidden">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1000 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ══ CANTO SUPERIOR DIREITO ══ */}
        <g opacity="0.38">
          <Galho d="M1000 0 Q920 60 860 130 Q800 200 760 290" w={2.5} />
          <Galho d="M860 130 Q900 100 940 70" w={1.8} />
          <Galho d="M800 200 Q840 170 875 145" w={1.5} />
          <Galho d="M760 290 Q800 265 830 240" w={1.4} />
          <Margarida cx={940} cy={65} r={32} />
          <Margarida cx={878} cy={142} r={24} c1="#F5C4B8" />
          <Rosa cx={835} cy={238} r={26} />
          <Margarida cx={762} cy={292} r={18} c1="#F5C4B8" />
          <Broto cx={760} cy={180} />
          <Broto cx={810} cy={110} />
          <Broto cx={900} cy={190} />
        </g>

        {/* ══ CANTO SUPERIOR ESQUERDO ══ */}
        <g opacity="0.28">
          <Galho d="M0 0 Q80 70 140 150 Q200 230 220 320" w={2.2} />
          <Galho d="M140 150 Q100 120 60 85" w={1.6} />
          <Galho d="M200 230 Q160 205 130 180" w={1.4} />
          <Margarida cx={58} cy={82} r={26} c1="#F5C4B8" />
          <Rosa cx={135} cy={175} r={22} />
          <Margarida cx={222} cy={318} r={20} />
          <Broto cx={100} cy={200} />
          <Broto cx={170} cy={120} />
        </g>

        {/* ══ LADO DIREITO MEIO ══ */}
        <g opacity="0.30">
          <Galho d="M1000 380 Q940 420 900 480 Q860 540 850 620" w={2} />
          <Galho d="M900 480 Q935 455 960 430" w={1.5} />
          <Rosa cx={958} cy={428} r={28} />
          <Margarida cx={898} cy={482} r={22} c1="#F5C4B8" />
          <Margarida cx={850} cy={622} r={19} />
          <Broto cx={880} cy={545} />
        </g>

        {/* ══ CANTO INFERIOR ESQUERDO ══ */}
        <g opacity="0.32">
          <Galho d="M0 800 Q70 730 140 660 Q210 590 270 510" w={2.3} />
          <Galho d="M140 660 Q100 640 65 610" w={1.6} />
          <Galho d="M210 590 Q175 570 148 545" w={1.4} />
          <Margarida cx={62} cy={608} r={28} />
          <Rosa cx={148} cy={542} r={24} />
          <Margarida cx={272} cy={508} r={20} c1="#F5C4B8" />
          <Broto cx={105} cy={690} />
          <Broto cx={190} cy={618} />
        </g>

        {/* ══ CANTO INFERIOR DIREITO ══ */}
        <g opacity="0.28">
          <Galho d="M1000 800 Q930 740 870 680 Q810 615 780 540" w={2} />
          <Galho d="M870 680 Q908 655 940 625" w={1.5} />
          <Rosa cx={942} cy={622} r={26} />
          <Margarida cx={868} cy={682} r={22} />
          <Margarida cx={778} cy={542} r={18} c1="#F5C4B8" />
          <Broto cx={910} cy={710} />
        </g>

        {/* ══ FLORES ESPALHADAS pelo centro/meio ══ */}
        <g opacity="0.15">
          <Margarida cx={380} cy={40} r={18} c1="#F5C4B8" />
          <Rosa cx={600} cy={80} r={16} />
          <Margarida cx={180} cy={420} r={15} />
          <Rosa cx={820} cy={350} r={18} />
          <Margarida cx={480} cy={760} r={16} c1="#F5C4B8" />
          <Rosa cx={280} cy={700} r={14} />
          <Margarida cx={700} cy={720} r={17} />
        </g>

        {/* ══ GALHOS DECORATIVOS soltos ══ */}
        <g opacity="0.18">
          <Galho d="M350 0 Q370 40 355 80" w={1.2} />
          <Galho d="M600 780 Q620 740 610 700" w={1.2} />
          <Galho d="M0 400 Q35 395 65 380" w={1.2} />
          <Galho d="M1000 600 Q965 595 940 580" w={1.2} />
          <circle cx={356} cy={82} r={5} fill="#EDA090" />
          <circle cx={609} cy={698} r={5} fill="#EDA090" />
          <circle cx={66} cy={379} r={4} fill="#EDA090" />
          <circle cx={939} cy={579} r={4} fill="#EDA090" />
        </g>
      </svg>
    </div>
  );
}

/* ─── Componentes SVG internos ─── */

function Galho({ d, w = 1.5 }: { d: string; w?: number }) {
  return (
    <path d={d} stroke="#C4776A" strokeWidth={w} fill="none"
      strokeLinecap="round" strokeLinejoin="round" />
  );
}

function Margarida({
  cx, cy, r, c1 = "#EDA090",
}: {
  cx: number; cy: number; r: number; c1?: string;
}) {
  const petals = 13;
  return (
    <g transform={`translate(${cx},${cy})`}>
      {Array.from({ length: petals }).map((_, i) => (
        <ellipse key={i} cx="0" cy={-(r * 1.75)}
          rx={r * 0.36} ry={r * 0.9}
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
    </g>
  );
}

function Rosa({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g transform={`translate(${cx},${cy})`}>
      {/* Sépalas */}
      {[0, 72, 144, 216, 288].map((a, i) => (
        <ellipse key={`s${i}`} cx="0" cy={r * 0.85}
          rx={r * 0.22} ry={r * 0.48}
          fill="#C4776A" opacity="0.4"
          transform={`rotate(${a})`} />
      ))}
      {/* Pétalas externas */}
      {[0, 51, 102, 153, 204, 255, 306].map((a, i) => (
        <ellipse key={`pe${i}`} cx="0" cy={-(r * 0.55)}
          rx={r * 0.38} ry={r * 0.65}
          fill="#EDA090" opacity="0.75"
          transform={`rotate(${a})`} />
      ))}
      {/* Pétalas médias */}
      {[25, 85, 145, 205, 265, 325].map((a, i) => (
        <ellipse key={`pm${i}`} cx="0" cy={-(r * 0.42)}
          rx={r * 0.33} ry={r * 0.52}
          fill="#E07A68" opacity="0.85"
          transform={`rotate(${a})`} />
      ))}
      {/* Pétalas internas */}
      {[0, 72, 144, 216, 288].map((a, i) => (
        <ellipse key={`pi${i}`} cx="0" cy={-(r * 0.28)}
          rx={r * 0.26} ry={r * 0.38}
          fill="#C4776A" opacity="0.9"
          transform={`rotate(${a})`} />
      ))}
      {/* Miolo */}
      <circle cx="0" cy="0" r={r * 0.22} fill="#A85E52" />
      <circle cx="0" cy="0" r={r * 0.12} fill="#8B3A35" />
      <ellipse cx={-(r * 0.06)} cy={-(r * 0.06)} rx={r * 0.08} ry={r * 0.06}
        fill="#EDA090" opacity="0.4" />
    </g>
  );
}

function Broto({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g transform={`translate(${cx},${cy})`}>
      <line x1="0" y1="18" x2="0" y2="4" stroke="#C4776A" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="0" cy="0" rx="4.5" ry="7" fill="#EDA090" />
      <ellipse cx="0" cy="1.5" rx="2.8" ry="4.5" fill="#F5C4B8" />
    </g>
  );
}
