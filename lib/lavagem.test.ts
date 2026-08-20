import { describe, it, expect } from "vitest";
import {
  rosterEfetivo,
  checarTransicao,
  validarNovaSolicitacao,
  excecoesParaTemporaria,
  ehDataPassada,
  diaSemanaUTC,
  parseDataUTC,
  formatDataUTC,
} from "./lavagem";

describe("rosterEfetivo", () => {
  it("retorna a base quando não há exceções", () => {
    const base = [{ userId: "a", slot: 0 }, { userId: "b", slot: 1 }];
    expect(rosterEfetivo(base, []).sort()).toEqual(["a", "b"]);
  });

  it("REMOVE tira alguém da base naquele dia", () => {
    const base = [{ userId: "a", slot: 0 }, { userId: "b", slot: 1 }];
    expect(rosterEfetivo(base, [{ userId: "a", acao: "REMOVE" }])).toEqual(["b"]);
  });

  it("ADICIONA pode exceder 2 na troca temporária", () => {
    const base = [{ userId: "a", slot: 0 }, { userId: "b", slot: 1 }];
    const r = rosterEfetivo(base, [{ userId: "c", acao: "ADICIONA" }]);
    expect(r).toHaveLength(3);
    expect(r).toContain("c");
  });

  it("permuta temporária: sai um, entra outro (continua 2)", () => {
    const base = [{ userId: "a", slot: 0 }, { userId: "b", slot: 1 }];
    const r = rosterEfetivo(base, [
      { userId: "a", acao: "REMOVE" },
      { userId: "c", acao: "ADICIONA" },
    ]);
    expect(r.sort()).toEqual(["b", "c"]);
  });

  it("não duplica quem já está na base", () => {
    const base = [{ userId: "a", slot: 0 }];
    expect(rosterEfetivo(base, [{ userId: "a", acao: "ADICIONA" }])).toEqual(["a"]);
  });
});

describe("checarTransicao (máquina de estados + autorização)", () => {
  it("admin aprova pendente", () => {
    expect(checarTransicao({ statusAtual: "PENDENTE", novoStatus: "APROVADA", papel: "ADMIN", ehDono: false }).ok).toBe(true);
  });

  it("moradora NÃO pode aprovar", () => {
    const r = checarTransicao({ statusAtual: "PENDENTE", novoStatus: "APROVADA", papel: "MORADORA", ehDono: true });
    expect(r.ok).toBe(false);
  });

  it("dona cancela a própria pendente", () => {
    expect(checarTransicao({ statusAtual: "PENDENTE", novoStatus: "CANCELADA", papel: "MORADORA", ehDono: true }).ok).toBe(true);
  });

  it("moradora NÃO cancela pedido de outra", () => {
    const r = checarTransicao({ statusAtual: "PENDENTE", novoStatus: "CANCELADA", papel: "MORADORA", ehDono: false });
    expect(r.ok).toBe(false);
  });

  it("estados finais são imutáveis (não cancela aprovada)", () => {
    const r = checarTransicao({ statusAtual: "APROVADA", novoStatus: "CANCELADA", papel: "MORADORA", ehDono: true });
    expect(r.ok).toBe(false);
  });

  it("não recusa algo já recusado", () => {
    const r = checarTransicao({ statusAtual: "RECUSADA", novoStatus: "RECUSADA", papel: "ADMIN", ehDono: false });
    expect(r.ok).toBe(false);
  });
});

describe("validarNovaSolicitacao", () => {
  const hoje = "2026-08-19";

  it("permanente exige dia desejado", () => {
    expect(validarNovaSolicitacao({ tipo: "PERMANENTE" }, hoje).ok).toBe(false);
    expect(validarNovaSolicitacao({ tipo: "PERMANENTE", diaDesejado: 3 }, hoje).ok).toBe(true);
  });

  it("permanente com contraparte exige dia de origem", () => {
    expect(validarNovaSolicitacao({ tipo: "PERMANENTE", diaDesejado: 3, contraparteId: "x" }, hoje).ok).toBe(false);
    expect(validarNovaSolicitacao({ tipo: "PERMANENTE", diaDesejado: 3, diaOrigem: 1, contraparteId: "x" }, hoje).ok).toBe(true);
  });

  it("temporária exige data e rejeita data passada", () => {
    expect(validarNovaSolicitacao({ tipo: "TEMPORARIA" }, hoje).ok).toBe(false);
    expect(validarNovaSolicitacao({ tipo: "TEMPORARIA", dataAlvo: "2026-08-18" }, hoje).ok).toBe(false);
    expect(validarNovaSolicitacao({ tipo: "TEMPORARIA", dataAlvo: "2026-08-20" }, hoje).ok).toBe(true);
  });

  it("aceita a própria data de hoje", () => {
    expect(validarNovaSolicitacao({ tipo: "TEMPORARIA", dataAlvo: hoje }, hoje).ok).toBe(true);
  });

  it("rejeita tipo inválido e dia fora de 0-6", () => {
    expect(validarNovaSolicitacao({ tipo: "OUTRO" }, hoje).ok).toBe(false);
    expect(validarNovaSolicitacao({ tipo: "PERMANENTE", diaDesejado: 9 }, hoje).ok).toBe(false);
  });
});

describe("excecoesParaTemporaria", () => {
  it("com contraparte: solicitante sai, contraparte entra", () => {
    expect(excecoesParaTemporaria({ solicitanteId: "a", contraparteId: "b" })).toEqual([
      { userId: "a", acao: "REMOVE" },
      { userId: "b", acao: "ADICIONA" },
    ]);
  });

  it("sem contraparte: solicitante entra", () => {
    expect(excecoesParaTemporaria({ solicitanteId: "a", contraparteId: null })).toEqual([
      { userId: "a", acao: "ADICIONA" },
    ]);
  });
});

describe("helpers de data (meio-dia UTC)", () => {
  it("ehDataPassada compara por dia", () => {
    expect(ehDataPassada("2026-08-18", "2026-08-19")).toBe(true);
    expect(ehDataPassada("2026-08-19", "2026-08-19")).toBe(false);
    expect(ehDataPassada("2026-08-20", "2026-08-19")).toBe(false);
  });

  it("diaSemanaUTC estável ao meio-dia UTC", () => {
    // 2026-08-19 é uma quarta-feira (3)
    expect(diaSemanaUTC(parseDataUTC("2026-08-19"))).toBe(3);
  });

  it("parse/format ida e volta", () => {
    expect(formatDataUTC(parseDataUTC("2026-12-25"))).toBe("2026-12-25");
  });
});
