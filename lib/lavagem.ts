// ─────────────────────────────────────────────
// Domínio: Máquina de Lavar
// Lógica pura (sem Prisma) — testável isoladamente.
// As mutações no banco ficam nas rotas (usam transação).
// ─────────────────────────────────────────────

export type StatusTroca = "PENDENTE" | "APROVADA" | "RECUSADA" | "CANCELADA";
export type TipoTroca = "PERMANENTE" | "TEMPORARIA";
export type AcaoExcecao = "ADICIONA" | "REMOVE";

export const DIAS_SEMANA = [
  "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado",
] as const;

/** Nº máximo de slots por dia na escala BASE (permanente). Temporária pode exceder. */
export const MAX_POR_DIA = 2;

// ── Datas ────────────────────────────────────
// Segue o padrão do projeto: datas ao meio-dia UTC evitam flip de fuso.

/** "YYYY-MM-DD" → Date ao meio-dia UTC. */
export function parseDataUTC(s: string): Date {
  return new Date(s + "T12:00:00.000Z");
}

/** Date → "YYYY-MM-DD" (parte de data em UTC). */
export function formatDataUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Dia da semana (0=Dom … 6=Sáb) de uma data ao meio-dia UTC. */
export function diaSemanaUTC(d: Date): number {
  return d.getUTCDay();
}

/** true se `data` (YYYY-MM-DD) é anterior a `hoje` (YYYY-MM-DD). Comparação por dia. */
export function ehDataPassada(data: string, hoje: string): boolean {
  return data < hoje;
}

// ── Roster efetivo de um dia ─────────────────

export interface AlocacaoBase { userId: string; slot: number }
export interface DeltaExcecao { userId: string; acao: AcaoExcecao }

/**
 * Roster efetivo de uma data específica:
 *   base(diaSemana) − REMOVE ∪ ADICIONA
 * A troca temporária pode fazer o resultado exceder MAX_POR_DIA — é intencional.
 */
export function rosterEfetivo(base: AlocacaoBase[], excecoes: DeltaExcecao[]): string[] {
  const remove = new Set(excecoes.filter(e => e.acao === "REMOVE").map(e => e.userId));
  const adiciona = excecoes.filter(e => e.acao === "ADICIONA").map(e => e.userId);

  const resultado = base.map(b => b.userId).filter(id => !remove.has(id));
  for (const id of adiciona) {
    if (!resultado.includes(id)) resultado.push(id);
  }
  return resultado;
}

// ── Máquina de estados ───────────────────────

export interface ContextoTransicao {
  statusAtual: StatusTroca;
  novoStatus: StatusTroca;
  papel: "ADMIN" | "MORADORA";
  ehDono: boolean; // a moradora que solicitou é a que está agindo?
}

export interface ResultadoTransicao { ok: boolean; erro?: string }

/**
 * Regras:
 *  • Só transiciona a partir de PENDENTE (estados finais são imutáveis).
 *  • CANCELADA: apenas a própria solicitante, e só enquanto PENDENTE.
 *  • APROVADA / RECUSADA: apenas ADMIN, e só enquanto PENDENTE.
 */
export function checarTransicao(ctx: ContextoTransicao): ResultadoTransicao {
  const { statusAtual, novoStatus, papel, ehDono } = ctx;

  if (statusAtual !== "PENDENTE") {
    return { ok: false, erro: "Esta solicitação já foi finalizada e não pode ser alterada." };
  }

  if (novoStatus === "CANCELADA") {
    if (!ehDono) return { ok: false, erro: "Só é possível cancelar a própria solicitação." };
    return { ok: true };
  }

  if (novoStatus === "APROVADA" || novoStatus === "RECUSADA") {
    if (papel !== "ADMIN") return { ok: false, erro: "Apenas a administradora pode aprovar ou recusar." };
    return { ok: true };
  }

  return { ok: false, erro: "Transição de status inválida." };
}

// ── Validação de nova solicitação ────────────

export interface PayloadNovaSolicitacao {
  tipo?: string;
  contraparteId?: string | null;
  diaOrigem?: number | null;
  diaDesejado?: number | null;
  dataAlvo?: string | null; // "YYYY-MM-DD"
}

function diaValido(d: unknown): d is number {
  return typeof d === "number" && Number.isInteger(d) && d >= 0 && d <= 6;
}

/**
 * Valida o payload de criação (regras que não dependem do banco).
 * A checagem de "1 pendente por tipo" é feita na rota (precisa consultar o banco).
 */
export function validarNovaSolicitacao(
  p: PayloadNovaSolicitacao,
  hoje: string,
): ResultadoTransicao {
  if (p.tipo !== "PERMANENTE" && p.tipo !== "TEMPORARIA") {
    return { ok: false, erro: "Tipo de troca inválido." };
  }

  if (p.diaOrigem != null && !diaValido(p.diaOrigem)) {
    return { ok: false, erro: "Dia de origem inválido." };
  }
  if (p.diaDesejado != null && !diaValido(p.diaDesejado)) {
    return { ok: false, erro: "Dia desejado inválido." };
  }

  if (p.tipo === "PERMANENTE") {
    if (!diaValido(p.diaDesejado)) {
      return { ok: false, erro: "Informe o dia desejado para a troca permanente." };
    }
    // Com contraparte, é permuta: precisa saber qual dia a solicitante cede.
    if (p.contraparteId && !diaValido(p.diaOrigem)) {
      return { ok: false, erro: "Informe o seu dia atual para permutar com a contraparte." };
    }
  }

  if (p.tipo === "TEMPORARIA") {
    if (!p.dataAlvo) {
      return { ok: false, erro: "Informe a data da troca temporária." };
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.dataAlvo)) {
      return { ok: false, erro: "Data inválida." };
    }
    if (ehDataPassada(p.dataAlvo, hoje)) {
      return { ok: false, erro: "Não é possível solicitar troca para uma data já passada." };
    }
  }

  return { ok: true };
}

/**
 * Deltas de ExcecaoLavagem gerados ao APROVAR uma troca temporária.
 *  • com contraparte: solicitante sai, contraparte entra (permuta no dia).
 *  • sem contraparte: solicitante entra no dia desejado (pode exceder 2).
 */
export function excecoesParaTemporaria(s: {
  solicitanteId: string;
  contraparteId: string | null;
}): DeltaExcecao[] {
  if (s.contraparteId) {
    return [
      { userId: s.solicitanteId, acao: "REMOVE" },
      { userId: s.contraparteId, acao: "ADICIONA" },
    ];
  }
  return [{ userId: s.solicitanteId, acao: "ADICIONA" }];
}
