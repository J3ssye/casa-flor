import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import bcrypt from "bcryptjs";

const SELECT = {
  id: true, nome: true, email: true, role: true, ativo: true,
  entradaEm: true, saidaPrevista: true, cor: true, dataNascimento: true, criadoEm: true,
};

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const user = await prisma.user.findUnique({ where: { id: params.id }, select: SELECT });
  if (!user) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { nome, email, role, ativo, senha, entradaEm, saidaPrevista, cor, dataNascimento } = body;

  const data: Record<string, unknown> = {};
  if (nome !== undefined) data.nome = nome;
  if (email !== undefined) data.email = email;
  if (role !== undefined) data.role = role === "ADMIN" ? "ADMIN" : "MORADORA";
  if (ativo !== undefined) data.ativo = ativo;
  if (senha) data.senha = await bcrypt.hash(senha, 12);
  if (cor !== undefined) data.cor = cor || null;
  if ("dataNascimento" in body) data.dataNascimento = dataNascimento ? new Date(dataNascimento) : null;
  if ("entradaEm" in body) data.entradaEm = entradaEm ? new Date(entradaEm) : null;
  if ("saidaPrevista" in body) data.saidaPrevista = saidaPrevista ? new Date(saidaPrevista) : null;

  try {
    const user = await prisma.user.update({ where: { id: params.id }, data, select: SELECT });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Moradora não encontrada" }, { status: 404 });
  }
}

// Soft delete (desativar)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();

  try {
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { ativo: body.ativo ?? false },
      select: { id: true, nome: true, ativo: true },
    });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Moradora não encontrada" }, { status: 404 });
  }
}
