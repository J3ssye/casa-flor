import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import type { NextRequest } from "next/server";

// ── Mock da sessão (next-auth) ───────────────
// lib/permissions usa getServerSession; controlamos quem está "logado" por teste.
const state = vi.hoisted(() => ({
  session: null as null | { user: { id: string; role: string } },
}));
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(async () => state.session),
}));

import { prisma } from "@/lib/prisma";
import { POST as escalaPOST } from "@/app/api/lavagem/escala/route";
import { POST as solicPOST } from "@/app/api/lavagem/solicitacoes/route";
import { PATCH as solicPATCH } from "@/app/api/lavagem/solicitacoes/[id]/route";

// ── Helpers ──────────────────────────────────
function actAs(user: { id: string; role: string } | null) {
  state.session = user ? { user } : null;
}
function jsonReq(body?: unknown, method = "POST") {
  // As rotas tipam NextRequest, mas em runtime só usam .json()/.url — Request basta.
  return new Request("http://localhost/", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }) as unknown as NextRequest;
}
async function read(res: Response) {
  return { status: res.status, body: await res.json().catch(() => null) };
}

const U = { admin: "", m1: "", m2: "", m3: "", m4: "" };

async function seedUser(nome: string, role: "ADMIN" | "MORADORA") {
  const email = `${nome}@itest.local`;
  const u = await prisma.user.upsert({
    where: { email },
    update: { ativo: true, role },
    create: { email, nome, role, senha: "x", ativo: true },
  });
  return u.id;
}

beforeAll(async () => {
  // TRAVA DE SEGURANÇA: só roda no banco de teste isolado.
  const [{ current_database }] = await prisma.$queryRawUnsafe<{ current_database: string }[]>(
    "SELECT current_database()",
  );
  if (current_database !== "republica_test") {
    throw new Error(`Testes abortados: conectado a "${current_database}", esperado "republica_test".`);
  }
  U.admin = await seedUser("itest-admin", "ADMIN");
  U.m1 = await seedUser("itest-m1", "MORADORA");
  U.m2 = await seedUser("itest-m2", "MORADORA");
  U.m3 = await seedUser("itest-m3", "MORADORA");
  U.m4 = await seedUser("itest-m4", "MORADORA");
});

beforeEach(async () => {
  await prisma.transicaoTrocaLavagem.deleteMany();
  await prisma.excecaoLavagem.deleteMany();
  await prisma.solicitacaoTrocaLavagem.deleteMany();
  await prisma.escalaLavagem.deleteMany();
  actAs(null);
});

// Preenche um dia da base (ajuda a forçar "dia cheio" nos testes).
async function encherDia(diaSemana: number, users: string[]) {
  await Promise.all(users.map((userId, slot) => prisma.escalaLavagem.create({ data: { userId, diaSemana, slot } })));
}

// ─────────────────────────────────────────────
describe("Escala base — limite de 2/dia", () => {
  it("bloqueia a 3ª moradora no mesmo dia", async () => {
    actAs({ id: U.admin, role: "ADMIN" });
    expect((await read(await escalaPOST(jsonReq({ userId: U.m1, diaSemana: 3 })))).status).toBe(201);
    expect((await read(await escalaPOST(jsonReq({ userId: U.m2, diaSemana: 3 })))).status).toBe(201);
    expect((await read(await escalaPOST(jsonReq({ userId: U.m3, diaSemana: 3 })))).status).toBe(409);
    expect(await prisma.escalaLavagem.count({ where: { diaSemana: 3 } })).toBe(2);
  });

  it("impede a mesma moradora duas vezes no mesmo dia", async () => {
    actAs({ id: U.admin, role: "ADMIN" });
    await escalaPOST(jsonReq({ userId: U.m1, diaSemana: 2 }));
    expect((await read(await escalaPOST(jsonReq({ userId: U.m1, diaSemana: 2 })))).status).toBe(409);
  });

  it("moradora não pode mexer na escala base (403)", async () => {
    actAs({ id: U.m1, role: "MORADORA" });
    expect((await read(await escalaPOST(jsonReq({ userId: U.m1, diaSemana: 1 })))).status).toBe(403);
  });
});

describe("Auto-aprovação na criação (sem passar pela admin)", () => {
  it("temporária é aplicada na hora e NÃO altera a base", async () => {
    await prisma.escalaLavagem.create({ data: { userId: U.m1, diaSemana: 3, slot: 0 } });
    const baseAntes = await prisma.escalaLavagem.findMany();

    actAs({ id: U.m1, role: "MORADORA" });
    const r = await read(await solicPOST(jsonReq({ tipo: "TEMPORARIA", dataAlvo: "2027-01-06", contraparteId: U.m2 })));
    expect(r.status).toBe(201);
    expect(r.body.status).toBe("APROVADA");

    expect(await prisma.escalaLavagem.findMany()).toEqual(baseAntes); // base intacta
    const exc = await prisma.excecaoLavagem.findMany();
    expect(exc).toHaveLength(2);
    expect(exc.map(e => `${e.acao}:${e.userId}`).sort()).toEqual([`ADICIONA:${U.m2}`, `REMOVE:${U.m1}`].sort());
  });

  it("temporária pode exceder 2/dia", async () => {
    await encherDia(3, [U.m1, U.m2]); // dia 3 cheio na base
    actAs({ id: U.m3, role: "MORADORA" });
    const r = await read(await solicPOST(jsonReq({ tipo: "TEMPORARIA", dataAlvo: "2027-01-06" })));
    expect(r.status).toBe(201);
    expect(r.body.status).toBe("APROVADA"); // não bloqueia
    expect(await prisma.excecaoLavagem.count()).toBe(1);
  });

  it("permanente que cabe é aplicada na hora (altera a base)", async () => {
    await prisma.escalaLavagem.create({ data: { userId: U.m1, diaSemana: 1, slot: 0 } });
    actAs({ id: U.m1, role: "MORADORA" });
    const r = await read(await solicPOST(jsonReq({ tipo: "PERMANENTE", diaOrigem: 1, diaDesejado: 4 })));
    expect(r.status).toBe(201);
    expect(r.body.status).toBe("APROVADA");

    expect(await prisma.escalaLavagem.findFirst({ where: { userId: U.m1, diaSemana: 1 } })).toBeNull();
    expect(await prisma.escalaLavagem.findFirst({ where: { userId: U.m1, diaSemana: 4 } })).not.toBeNull();

    const trans = await prisma.transicaoTrocaLavagem.findMany({ where: { solicitacaoId: r.body.id } });
    expect(trans.map(t => t.paraStatus).sort()).toEqual(["APROVADA", "PENDENTE"]);
  });

  it("permanente que NÃO cabe fica pendente e não altera a base", async () => {
    await encherDia(4, [U.m3, U.m4]); // dia 4 cheio
    actAs({ id: U.m1, role: "MORADORA" });
    const r = await read(await solicPOST(jsonReq({ tipo: "PERMANENTE", diaDesejado: 4 })));
    expect(r.status).toBe(201);
    expect(r.body.status).toBe("PENDENTE"); // não coube → aguarda admin

    expect(await prisma.escalaLavagem.count({ where: { diaSemana: 4 } })).toBe(2);
    expect(await prisma.escalaLavagem.findFirst({ where: { userId: U.m1, diaSemana: 4 } })).toBeNull();
  });
});

describe("Cancelamento — só enquanto pendente, só a dona", () => {
  // Para ficar PENDENTE, o dia desejado precisa estar cheio (senão auto-aprova).
  async function criarPendenteM1() {
    await encherDia(5, [U.m3, U.m4]);
    actAs({ id: U.m1, role: "MORADORA" });
    const c = await read(await solicPOST(jsonReq({ tipo: "PERMANENTE", diaDesejado: 5 })));
    expect(c.body.status).toBe("PENDENTE");
    return c.body.id as string;
  }

  it("a dona cancela sua pendente; segunda vez falha (finalizada)", async () => {
    const id = await criarPendenteM1();
    actAs({ id: U.m1, role: "MORADORA" });
    expect((await read(await solicPATCH(jsonReq({ acao: "cancelar" }, "PATCH"), { params: { id } }))).status).toBe(200);
    expect((await read(await solicPATCH(jsonReq({ acao: "cancelar" }, "PATCH"), { params: { id } }))).status).toBe(409);
  });

  it("outra moradora NÃO cancela pedido alheio (403)", async () => {
    const id = await criarPendenteM1();
    actAs({ id: U.m2, role: "MORADORA" });
    expect((await read(await solicPATCH(jsonReq({ acao: "cancelar" }, "PATCH"), { params: { id } }))).status).toBe(403);
  });
});

describe("Aprovação manual pela admin (casos que não couberam)", () => {
  it("moradora NÃO aprova (403); admin aprova após liberar vaga (200)", async () => {
    await encherDia(5, [U.m3, U.m4]); // cheio → pedido fica pendente
    actAs({ id: U.m1, role: "MORADORA" });
    const id = (await read(await solicPOST(jsonReq({ tipo: "PERMANENTE", diaDesejado: 5 })))).body.id;

    // moradora não aprova
    actAs({ id: U.m2, role: "MORADORA" });
    expect((await read(await solicPATCH(jsonReq({ acao: "aprovar" }, "PATCH"), { params: { id } }))).status).toBe(403);

    // admin tenta aprovar com o dia ainda cheio → 409 (lazy)
    actAs({ id: U.admin, role: "ADMIN" });
    expect((await read(await solicPATCH(jsonReq({ acao: "aprovar" }, "PATCH"), { params: { id } }))).status).toBe(409);

    // libera uma vaga e aprova → 200
    const umaDoDia = await prisma.escalaLavagem.findFirst({ where: { diaSemana: 5 } });
    await prisma.escalaLavagem.delete({ where: { id: umaDoDia!.id } });
    expect((await read(await solicPATCH(jsonReq({ acao: "aprovar" }, "PATCH"), { params: { id } }))).status).toBe(200);
    expect(await prisma.escalaLavagem.count({ where: { diaSemana: 5 } })).toBe(2);
  });
});

describe("Condição de corrida na aprovação", () => {
  it("duas aprovações para o último slot não furam o limite de 2", async () => {
    // dia 5 cheio → os dois pedidos nascem PENDENTE
    await encherDia(5, [U.m3, U.m4]);
    actAs({ id: U.m1, role: "MORADORA" });
    const a = (await read(await solicPOST(jsonReq({ tipo: "PERMANENTE", diaDesejado: 5 })))).body.id;
    actAs({ id: U.m2, role: "MORADORA" });
    const b = (await read(await solicPOST(jsonReq({ tipo: "PERMANENTE", diaDesejado: 5 })))).body.id;

    // libera exatamente 1 vaga
    const umaDoDia = await prisma.escalaLavagem.findFirst({ where: { diaSemana: 5 } });
    await prisma.escalaLavagem.delete({ where: { id: umaDoDia!.id } });

    // duas aprovações simultâneas disputam a última vaga
    actAs({ id: U.admin, role: "ADMIN" });
    const [ra, rb] = await Promise.all([
      solicPATCH(jsonReq({ acao: "aprovar" }, "PATCH"), { params: { id: a } }).then(read),
      solicPATCH(jsonReq({ acao: "aprovar" }, "PATCH"), { params: { id: b } }).then(read),
    ]);

    expect([ra.status, rb.status].sort()).toEqual([200, 409]);
    expect(await prisma.escalaLavagem.count({ where: { diaSemana: 5 } })).toBe(2);
  });
});
