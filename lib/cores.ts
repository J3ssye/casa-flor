/**
 * Paleta de cores das moradoras (feminina e diversa).
 * Cada cor tem:
 *  - bg/text/border: usados nos "chips" do calendário (fundo claro + texto escuro legível)
 *  - swatch: a cor sólida, usada no seletor e nas bolinhas de legenda
 * A moradora guarda apenas a CHAVE (key); as cores reais ficam aqui.
 */

export interface CorMoradora {
  key: string;
  label: string;
  bg: string;
  text: string;
  border: string;
  swatch: string;
}

export const PALETA_CORES: CorMoradora[] = [
  { key: "rosa-choque", label: "Rosa choque", bg: "#fce7f3", text: "#9d174d", border: "#f9a8d4", swatch: "#ec4899" },
  { key: "rosa-claro",  label: "Rosa claro",  bg: "#fdf2f8", text: "#be185d", border: "#fbcfe8", swatch: "#f9a8d4" },
  { key: "coral",       label: "Coral",       bg: "#fff1f2", text: "#9f1239", border: "#fecdd3", swatch: "#fb7185" },
  { key: "vermelho",    label: "Vermelho",    bg: "#fee2e2", text: "#991b1b", border: "#fca5a5", swatch: "#ef4444" },
  { key: "pessego",     label: "Pêssego",     bg: "#fff7ed", text: "#9a3412", border: "#fed7aa", swatch: "#fb923c" },
  { key: "terracota",   label: "Terracota",   bg: "#f3e7e1", text: "#7c4a3a", border: "#dcc3b6", swatch: "#b07a64" },
  { key: "amarelo",     label: "Amarelo",     bg: "#fefce8", text: "#854d0e", border: "#fde68a", swatch: "#facc15" },
  { key: "menta",       label: "Verde menta", bg: "#ecfdf5", text: "#047857", border: "#a7f3d0", swatch: "#34d399" },
  { key: "azul-bebe",   label: "Azul bebê",   bg: "#eff6ff", text: "#1e40af", border: "#bfdbfe", swatch: "#60a5fa" },
  { key: "lavanda",     label: "Lavanda",     bg: "#faf5ff", text: "#7e22ce", border: "#e9d5ff", swatch: "#c084fc" },
  { key: "lilas",       label: "Lilás",       bg: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe", swatch: "#a78bfa" },
  { key: "roxo",        label: "Roxo",        bg: "#ede9fe", text: "#5b21b6", border: "#c4b5fd", swatch: "#8b5cf6" },
  { key: "cinza",       label: "Cinza claro", bg: "#f3f4f6", text: "#374151", border: "#d1d5db", swatch: "#9ca3af" },
  { key: "branco",      label: "Branco",      bg: "#ffffff", text: "#4b5563", border: "#d1d5db", swatch: "#f8fafc" },
];

/** Busca uma cor pela chave; retorna null se não existir/estiver vazia. */
export function corPorChave(key: string | null | undefined): CorMoradora | null {
  if (!key) return null;
  return PALETA_CORES.find((c) => c.key === key) ?? null;
}

/**
 * Cor efetiva de uma moradora:
 * usa a cor escolhida; se não houver, cai numa cor da paleta pelo índice
 * (assim moradoras sem cor definida ainda ficam variadas e estáveis).
 */
export function corDaModadora(cor: string | null | undefined, idx: number): CorMoradora {
  return corPorChave(cor) ?? PALETA_CORES[idx % PALETA_CORES.length];
}
