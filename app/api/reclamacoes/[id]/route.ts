import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

// Somente admins alteram status e respondem reclamações
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.status !== undefined) data.status = body.status;
  if (body.respostaAdmin !== undefined) data.respostaAdmin = body.respostaAdmin;

  try {
    const rec = await prisma.reclamacao.update({ where: { id: params.id }, data });
    return NextResponse.json(rec);
  } catch {
    return NextResponse.json({ error: "Reclamação não encontrada" }, { status: 404 });
  }
}
