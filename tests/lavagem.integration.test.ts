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
import { DELETE as escalaDELETE } from "@/app/api/lavagem/escala/[id]/route";
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

// IDs dos usuários de teste (criados no beforeAll)
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
  // Limpa apenas as tabelas da feature entre os testes.
  await prisma.transicaoTrocaLavagem.deleteMany();
  await prisma.excecaoLavagem.deleteMany();
  await prisma.solicitacaoTrocaLavagem.deleteMany();
  await prisma.escalaLavagem.deleteMany();
  actAs(null);
});

// ─────────────────────────────────────────────
describe("Escala base — limite de 2/dia", () => {
  it("bloqueia a 3ª moradora no mesmo dia", async () => {
    actAs({ id: U.admin, role: "ADMIN" });
    expect((await read(await escalaPOST(jsonReq({ userId: U.m1, diaSemana: 3 })))).status).toBe(201);
    expect((await read(await escalaPOST(jsonReq({ userId: U.m2, diaSemana: 3 })))).status).toBe(201);

    const terceira = await read(await escalaPOST(jsonReq({ userId: U.m3, diaSemana: 3 })));
    expect(terceira.status).toBe(409);

    const count = await prisma.escalaLavagem.count({ where: { diaSemana: 3 } });
    expect(count).toBe(2);
  });

  it("impede a mesma moradora duas vezes no mesmo dia", async () => {
    actAs({ id: U.admin, role: "ADMIN" });
    await escalaPOST(jsonReq({ userId: U.m1, diaSemana: 2 }));
    const dup = await read(await escalaPOST(jsonReq({ userId: U.m1, diaSemana: 2 })));
    expect(dup.status).toBe(409);
  });

  it("moradora não pode mexer na escala base (403)", async () => {
    actAs({ id: U.m1, role: "MORADORA" });
    const res = await read(await escalaPOST(jsonReq({ userId: U.m1, diaSemana: 1 })));
    expect(res.status).toBe(403);
  });
});

describe("Aprovação permanente — altera a base", () => {
  it("move a solicitante para o dia desejado", async () => {
    await prisma.escalaLavagem.create({ data: { userId: U.m1, diaSemana: 1, slot: 0 } });

    actAs({ id: U.m1, role: "MORADORA" });
    const criada = await read(await solicPOST(jsonReq({ tipo: "PERMANENTE", diaOrigem: 1, diaDesejado: 4 })));
    expect(criada.status).toBe(201);

    actAs({ id: U.admin, role: "ADMIN" });
    const aprov = await read(await solicPATCH(jsonReq({ acao: "aprovar" }, "PATCH"), { params: { id: criada.body.id } }));
    expect(aprov.status).toBe(200);
    expect(aprov.body.status).toBe("APROVADA");

    const emSeg = await prisma.escalaLavagem.findFirst({ where: { userId: U.m1, diaSemana: 1 } });
    const emQui = await prisma.escalaLavagem.findFirst({ where: { userId: U.m1, diaSemana: 4 } });
    expect(emSeg).toBeNull();       // saiu da segunda
    expect(emQui).not.toBeNull();   // entrou na quinta

    // histórico append-only: criação + aprovação
    const trans = await prisma.transicaoTrocaLavagem.findMany({ where: { solicitacaoId: criada.body.id } });
    expect(trans.map(t => t.paraStatus).sort()).toEqual(["APROVADA", "PENDENTE"]);
  });
});

describe("Aprovação temporária — NÃO altera a base", () => {
  it("grava exceção do dia e deixa a base intacta", async () => {
    await prisma.escalaLavagem.create({ data: { userId: U.m1, diaSemana: 3, slot: 0 } });
    const baseAntes = await prisma.escalaLavagem.findMany();

    actAs({ id: U.m1, role: "MORADORA" });
    // 2027-01-06 é uma quarta-feira (dia 3) — futura
    const criada = await read(await solicPOST(jsonReq({
      tipo: "TEMPORARIA", dataAlvo: "2027-01-06", contraparteId: U.m2,
    })));
    expect(criada.status).toBe(201);

    actAs({ id: U.admin, role: "ADMIN" });
    const aprov = await read(await solicPATCH(jsonReq({ acao: "aprovar" }, "PATCH"), { params: { id: criada.body.id } }));
    expect(aprov.status).toBe(200);

    const baseDepois = await prisma.escalaLavagem.findMany();
    expect(baseDepois).toEqual(baseAntes); // base inalterada

    const exc = await prisma.excecaoLavagem.findMany({ orderBy: { acao: "asc" } });
    expect(exc).toHaveLength(2);
    expect(exc.map(e => `${e.acao}:${e.userId}`).sort()).toEqual(
      [`ADICIONA:${U.m2}`, `REMOVE:${U.m1}`].sort(),
    );
  });

  it("temporária pode exceder 2/dia (sem contraparte, dia cheio)", async () => {
    // dia 3 já cheio na base
    await prisma.escalaLavagem.create({ data: { userId: U.m1, diaSemana: 3, slot: 0 } });
    await prisma.escalaLavagem.create({ data: { userId: U.m2, diaSemana: 3, slot: 1 } });

    actAs({ id: U.m3, role: "MORADORA" });
    const criada = await read(await solicPOST(jsonReq({ tipo: "TEMPORARIA", dataAlvo: "2027-01-06" })));
    actAs({ id: U.admin, role: "ADMIN" });
    const aprov = await read(await solicPATCH(jsonReq({ acao: "aprovar" }, "PATCH"), { params: { id: criada.body.id } }));
    expect(aprov.status).toBe(200); // não bloqueia — temporária excede

    const exc = await prisma.excecaoLavagem.findMany();
    expect(exc).toHaveLength(1);
    expect(exc[0].acao).toBe("ADICIONA");
  });
});

describe("Cancelamento — só enquanto pendente, só a dona", () => {
  async function criarPendenteM1() {
    actAs({ id: U.m1, role: "MORADORA" });
    const c = await read(await solicPOST(jsonReq({ tipo: "PERMANENTE", diaDesejado: 5 })));
    return c.body.id as string;
  }

  it("a dona cancela sua pendente; segunda vez falha (finalizada)", async () => {
    const id = await criarPendenteM1();
    actAs({ id: U.m1, role: "MORADORA" });
    expect((await read(await solicPATCH(jsonReq({ acao: "cancelar" }, "PATCH"), { params: { id } }))).status).toBe(200);
    // já CANCELADA → imutável
    expect((await read(await solicPATCH(jsonReq({ acao: "cancelar" }, "PATCH"), { params: { id } }))).status).toBe(409);
  });

  it("outra moradora NÃO cancela pedido alheio (403)", async () => {
    const id = await criarPendenteM1();
    actAs({ id: U.m2, role: "MORADORA" });
    expect((await read(await solicPATCH(jsonReq({ acao: "cancelar" }, "PATCH"), { params: { id } }))).status).toBe(403);
  });

  it("moradora NÃO aprova (403); admin aprova (200)", async () => {
    // m1 está na segunda (1) e pede para passar à sexta (5), que está livre
    await prisma.escalaLavagem.create({ data: { userId: U.m1, diaSemana: 1, slot: 0 } });
    const id = await criarPendenteM1();
    actAs({ id: U.m2, role: "MORADORA" });
    expect((await read(await solicPATCH(jsonReq({ acao: "aprovar" }, "PATCH"), { params: { id } }))).status).toBe(403);
    actAs({ id: U.admin, role: "ADMIN" });
    expect((await read(await solicPATCH(jsonReq({ acao: "aprovar" }, "PATCH"), { params: { id } }))).status).toBe(200);
  });
});

describe("Condição de corrida na aprovação permanente", () => {
  it("duas aprovações para o último slot não furam o limite de 2", async () => {
    // dia 5: 1 vaga livre (m4 ocupa slot 0)
    await prisma.escalaLavagem.create({ data: { userId: U.m4, diaSemana: 5, slot: 0 } });

    actAs({ id: U.m1, role: "MORADORA" });
    const a = (await read(await solicPOST(jsonReq({ tipo: "PERMANENTE", diaDesejado: 5 })))).body.id;
    actAs({ id: U.m2, role: "MORADORA" });
    const b = (await read(await solicPOST(jsonReq({ tipo: "PERMANENTE", diaDesejado: 5 })))).body.id;

    actAs({ id: U.admin, role: "ADMIN" });
    const [ra, rb] = await Promise.all([
      solicPATCH(jsonReq({ acao: "aprovar" }, "PATCH"), { params: { id: a } }).then(read),
      solicPATCH(jsonReq({ acao: "aprovar" }, "PATCH"), { params: { id: b } }).then(read),
    ]);

    const statuses = [ra.status, rb.status].sort();
    expect(statuses).toEqual([200, 409]); // exatamente uma aprova, a outra é barrada

    const count = await prisma.escalaLavagem.count({ where: { diaSemana: 5 } });
    expect(count).toBe(2); // limite mantido pelo banco
  });
});
