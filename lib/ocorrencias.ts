/**
 * Lógica pura de ocorrências de uma tarefa dentro do mês.
 * Sem dependência de Prisma — pode ser usada no servidor e no cliente.
 *
 * Dois modos:
 *  - "TODOS":     a tarefa deve ser feita em CADA dia marcado (ex: seg E qui).
 *                 Cada dia é uma ocorrência independente.
 *  - "UM_DENTRE": a tarefa deve ser feita UMA vez por semana, em qualquer um
 *                 dos dias marcados (ex: seg, ter OU qua). Cada semana é uma
 *                 ocorrência, satisfeita ao marcar qualquer dia candidato.
 *  - diasSemana vazio: ocorrência única no prazo final (dataFim).
 */

export interface ItemOcorrencia {
  dataInicio: string;
  dataFim: string;
  diasSemana: number[];
  modoDias: string; // "TODOS" | "UM_DENTRE"
}

export interface Ocorrencia {
  data: string;       // "YYYY-MM-DD"
  weekday: number;    // 0=Dom … 6=Sáb
  semanaIdx: number;  // índice da semana no mês (alinhado às linhas do calendário)
}

export interface SemanaFlex {
  semanaIdx: number;
  candidatos: Ocorrencia[];
}

const DIAS_LABEL = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export function labelDia(d: number) { return DIAS_LABEL[d] ?? "?"; }

/** "YYYY-MM-DD…" → Date ao meio-dia UTC (estável em qualquer fuso). */
export function parseDataUTC(s: string): Date {
  return new Date(s.slice(0, 10) + "T12:00:00.000Z");
}

/** Date → "YYYY-MM-DD" (em UTC). */
export function isoData(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Lista todas as datas-candidatas da ocorrência, em ordem. */
export function gerarOcorrencias(item: ItemOcorrencia): Ocorrencia[] {
  const inicio = parseDataUTC(item.dataInicio);
  const fim    = parseDataUTC(item.dataFim);
  const dias   = item.diasSemana ?? [];

  // Sem dias fixos → ocorrência única no prazo final
  if (dias.length === 0) {
    return [{ data: isoData(fim), weekday: fim.getUTCDay(), semanaIdx: 0 }];
  }

  // semanaIdx alinhado às linhas do calendário (Dom–Sáb) do mês de início
  const primeiroDoMes = new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth(), 1, 12));
  const offset = primeiroDoMes.getUTCDay();

  const result: Ocorrencia[] = [];
  const cursor = new Date(inicio);
  while (cursor <= fim) {
    const wd = cursor.getUTCDay();
    if (dias.includes(wd)) {
      const dom = cursor.getUTCDate();
      result.push({ data: isoData(cursor), weekday: wd, semanaIdx: Math.floor((dom - 1 + offset) / 7) });
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

/** Agrupa as ocorrências por semana (usado no modo UM_DENTRE). */
export function agruparPorSemana(item: ItemOcorrencia): SemanaFlex[] {
  const ocs = gerarOcorrencias(item);
  const mapa = new Map<number, Ocorrencia[]>();
  for (const o of ocs) {
    if (!mapa.has(o.semanaIdx)) mapa.set(o.semanaIdx, []);
    mapa.get(o.semanaIdx)!.push(o);
  }
  return Array.from(mapa.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([semanaIdx, candidatos]) => ({ semanaIdx, candidatos }));
}

export interface ResumoConclusao {
  feitas: number;
  total: number;
  percentual: number;
}

/** Calcula progresso a partir das datas marcadas como feitas. */
export function calcularConclusao(item: ItemOcorrencia, marcacoes: string[]): ResumoConclusao {
  const feitasSet = new Set(marcacoes.map(m => m.slice(0, 10)));
  const flex = item.modoDias === "UM_DENTRE" && (item.diasSemana?.length ?? 0) > 0;

  if (flex) {
    const semanas = agruparPorSemana(item);
    const total  = semanas.length;
    const feitas = semanas.filter(s => s.candidatos.some(c => feitasSet.has(c.data))).length;
    return { feitas, total, percentual: total === 0 ? 0 : Math.round((feitas / total) * 100) };
  }

  const ocs    = gerarOcorrencias(item);
  const total  = ocs.length;
  const feitas = ocs.filter(o => feitasSet.has(o.data)).length;
  return { feitas, total, percentual: total === 0 ? 0 : Math.round((feitas / total) * 100) };
}
