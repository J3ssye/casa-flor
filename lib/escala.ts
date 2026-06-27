import { prisma } from "@/lib/prisma";
import { Periodicidade } from "@prisma/client";
import { calcularConclusao, isoData } from "@/lib/ocorrencias";

// ─────────────────────────────────────────────
// Recalcula percentual + status de um item a partir das marcações
// ─────────────────────────────────────────────

export async function recomputarConclusao(escalaItemId: string) {
  const item = await prisma.escalaItem.findUnique({
    where: { id: escalaItemId },
    include: { marcacoes: { select: { data: true } } },
  });
  if (!item) return null;

  const marcacoes = item.marcacoes.map(m => isoData(m.data));
  const { percentual } = calcularConclusao(
    {
      dataInicio: isoData(item.dataInicio),
      dataFim:    isoData(item.dataFim),
      diasSemana: item.diasSemana,
      modoDias:   item.modoDias,
    },
    marcacoes
  );

  let status: "PENDENTE" | "CONCLUIDA" | "ATRASADA";
  if (percentual >= 100)              status = "CONCLUIDA";
  else if (item.dataFim < new Date()) status = "ATRASADA";
  else                                status = "PENDENTE";

  return prisma.escalaItem.update({
    where: { id: escalaItemId },
    data: { percentualConclusao: percentual, status },
  });
}

// ─────────────────────────────────────────────
// Helpers de data
// ─────────────────────────────────────────────

function addDias(data: Date, dias: number): Date {
  const d = new Date(data);
  d.setDate(d.getDate() + dias);
  return d;
}

function inicioMes(ref: Date): Date {
  return new Date(ref.getFullYear(), ref.getMonth(), 1);
}

function fimMes(ref: Date): Date {
  return new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59);
}

function diasNoMes(ref: Date): number {
  return new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
}

function semanasNoMes(ref: Date): number {
  return Math.ceil(diasNoMes(ref) / 7);
}

/**
 * Calcula quantas vezes uma tarefa ocorre no mês.
 * - vezesNaSemana definido → N × semanas no mês
 * - periodicidade enum → conforme tabela abaixo
 */
function ocorrenciasNoMes(
  periodicidade: Periodicidade,
  vezesNaSemana: number | null,
  ref: Date
): number {
  if (vezesNaSemana != null && vezesNaSemana > 0) {
    return vezesNaSemana * semanasNoMes(ref);
  }
  switch (periodicidade) {
    case "DIARIA":    return diasNoMes(ref);
    case "SEMANAL":   return semanasNoMes(ref);
    case "QUINZENAL": return 2;
    case "MENSAL":    return 1;
  }
}

/**
 * Distribui N datas uniformemente ao longo do mês.
 * Ex: 8 ocorrências em 30 dias → a cada ~3,75 dias
 */
function distribuirDatas(inicio: Date, fim: Date, n: number): Date[] {
  if (n <= 0) return [];
  const totalMs = fim.getTime() - inicio.getTime();
  const intervaloMs = n === 1 ? 0 : totalMs / (n - 1);
  return Array.from({ length: n }, (_, i) =>
    new Date(inicio.getTime() + Math.round(i * intervaloMs))
  );
}

// ─────────────────────────────────────────────
// Geração de escala mensal
// ─────────────────────────────────────────────

/**
 * Gera a escala para o mês de referência (padrão: mês atual).
 * Distribui as ocorrências de cada tarefa em rodízio entre as moradoras ativas.
 * Pula itens que já existam no período para evitar duplicatas.
 * Retorna quantos itens foram criados.
 */
export async function gerarEscalaMensal(ref: Date = new Date()): Promise<number> {
  const inicio = inicioMes(ref);
  const fim = fimMes(ref);

  const [tarefas, moradoras] = await Promise.all([
    prisma.tarefa.findMany({
      where: { ativo: true },
      orderBy: { titulo: "asc" },
    }),
    prisma.user.findMany({
      where: { ativo: true },
      orderBy: { criadoEm: "asc" },
    }),
  ]);

  if (moradoras.length === 0 || tarefas.length === 0) return 0;

  let criados = 0;

  for (const tarefa of tarefas) {
    const n = ocorrenciasNoMes(tarefa.periodicidade, tarefa.vezesNaSemana, ref);
    const datas = distribuirDatas(inicio, fim, n);

    // Descobre índice da última responsável desta tarefa (para continuar o rodízio)
    const ultimoItem = await prisma.escalaItem.findFirst({
      where: { tarefaId: tarefa.id },
      orderBy: { dataInicio: "desc" },
    });
    let ultimoIdx = -1;
    if (ultimoItem) {
      ultimoIdx = moradoras.findIndex((m) => m.id === ultimoItem.userId);
    }

    for (let i = 0; i < datas.length; i++) {
      const dataInicio = datas[i];
      // dataFim = véspera da próxima ocorrência (ou fim do mês na última)
      const dataFim = i + 1 < datas.length
        ? addDias(datas[i + 1], -1)
        : fim;

      // Evita duplicata: pula se já existe item começando neste dia para esta tarefa
      const jaExiste = await prisma.escalaItem.findFirst({
        where: {
          tarefaId: tarefa.id,
          dataInicio: {
            gte: new Date(dataInicio.getFullYear(), dataInicio.getMonth(), dataInicio.getDate()),
            lt:  new Date(dataInicio.getFullYear(), dataInicio.getMonth(), dataInicio.getDate() + 1),
          },
        },
      });
      if (jaExiste) continue;

      const moradaIdx = (ultimoIdx + 1 + i) % moradoras.length;
      const moradora = moradoras[moradaIdx];

      await prisma.escalaItem.create({
        data: {
          tarefaId: tarefa.id,
          userId: moradora.id,
          dataInicio,
          dataFim,
          status: "PENDENTE",
          percentualConclusao: 0,
        },
      });
      criados++;
    }
  }

  return criados;
}

// ─────────────────────────────────────────────
// Redistribuição quando moradora sai
// ─────────────────────────────────────────────

/**
 * Redistribui todas as tarefas PENDENTE/ATRASADA de uma moradora
 * entre as demais ativas, em rodízio simples.
 * Retorna quantos itens foram redistribuídos.
 */
export async function redistribuirTarefas(userId: string): Promise<number> {
  const [itens, moradoras] = await Promise.all([
    prisma.escalaItem.findMany({
      where: {
        userId,
        status: { in: ["PENDENTE", "ATRASADA"] },
      },
      orderBy: { dataInicio: "asc" },
    }),
    prisma.user.findMany({
      where: { ativo: true, id: { not: userId } },
      orderBy: { criadoEm: "asc" },
    }),
  ]);

  if (moradoras.length === 0 || itens.length === 0) return 0;

  for (let i = 0; i < itens.length; i++) {
    const nova = moradoras[i % moradoras.length];
    await prisma.escalaItem.update({
      where: { id: itens[i].id },
      data: { userId: nova.id },
    });
  }

  return itens.length;
}

// ─────────────────────────────────────────────
// Atualizar itens atrasados
// ─────────────────────────────────────────────

export async function atualizarAtrasados(): Promise<number> {
  const resultado = await prisma.escalaItem.updateMany({
    where: {
      status: "PENDENTE",
      percentualConclusao: { lt: 100 },
      dataFim: { lt: new Date() },
    },
    data: { status: "ATRASADA" },
  });
  return resultado.count;
}
