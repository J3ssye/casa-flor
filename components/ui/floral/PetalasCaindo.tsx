"use client";

import { useEffect, useState } from "react";

interface Petala {
  id: number;
  left: number;    // posição horizontal inicial (%)
  size: number;    // tamanho base (px)
  cor: string;
  duracao: number; // s
  atraso: number;  // s
  giro: number;    // rotação final (deg)
  sway: number;    // amplitude do balanço (px)
}

const CORES = ["#ec4899", "#f9a8d4", "#fb7185", "#f472b6", "#c084fc", "#fbcfe8", "#e879f9", "#fda4af"];

function gerar(qtd: number): Petala[] {
  return Array.from({ length: qtd }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: 10 + Math.random() * 12,
    cor: CORES[Math.floor(Math.random() * CORES.length)],
    duracao: 4.5 + Math.random() * 3.5,
    atraso: Math.random() * 1.6,
    giro: 360 + Math.random() * 540,
    sway: 25 + Math.random() * 55,
  }));
}

/**
 * Chuva de pétalas (comemoração). Renderiza uma camada fixa por cima da tela
 * quando `ativo` fica true; some sozinha após ~7s e chama `onFim`.
 */
export default function PetalasCaindo({ ativo, onFim }: { ativo: boolean; onFim?: () => void }) {
  const [petalas, setPetalas] = useState<Petala[]>([]);

  useEffect(() => {
    if (!ativo) return;
    setPetalas(gerar(50));
    const t = setTimeout(() => { setPetalas([]); onFim?.(); }, 7200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo]);

  if (petalas.length === 0) return null;

  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 60 }}>
      <style>{`
        @keyframes petala-queda {
          0%   { transform: translate(0, -12vh) rotate(0deg); opacity: 0; }
          8%   { opacity: 1; }
          25%  { transform: translate(var(--sway), 28vh) rotate(160deg); }
          50%  { transform: translate(calc(var(--sway) * -1), 55vh) rotate(320deg); }
          75%  { transform: translate(var(--sway), 82vh) rotate(480deg); }
          100% { transform: translate(0, 113vh) rotate(var(--giro)); opacity: 0.9; }
        }
      `}</style>
      {petalas.map((p) => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            top: 0,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.3,
            backgroundColor: p.cor,
            borderRadius: "100% 0 100% 0",
            opacity: 0,
            ...( { "--sway": `${p.sway}px`, "--giro": `${p.giro}deg` } as React.CSSProperties ),
            animation: `petala-queda ${p.duracao}s ${p.atraso}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}
