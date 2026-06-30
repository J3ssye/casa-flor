import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import bcrypt from "bcryptjs";

const SELECT = {
  id: true, nome: true, email: true, role: true, ativo: true,
  entradaEm: true, saidaPrevista: true, cor: true, dataNascimento: true, criadoEm: true,
};

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const moradoras = await prisma.user.findMany({
    orderBy: { nome: "asc" },
    select: SELECT,
  });

  return NextResponse.json(moradoras);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { nome, email, senha, role, entradaEm, saidaPrevista, cor, dataNascimento } = body;

  if (!nome || !email || !senha) {
    return NextResponse.json({ error: "nome, email e senha são obrigatórios" }, { status: 400 });
  }

  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) {
    return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });
  }

  const hash = await bcrypt.hash(senha, 12);

  const user = await prisma.user.create({
    data: {
      nome,
      email,
      senha: hash,
      role: role === "ADMIN" ? "ADMIN" : "MORADORA",
      entradaEm: entradaEm ? new Date(entradaEm) : null,
      saidaPrevista: saidaPrevista ? new Date(saidaPrevista) : null,
      cor: cor || null,
      dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
    },
    select: SELECT,
  });

  return NextResponse.json(user, { status: 201 });
}
