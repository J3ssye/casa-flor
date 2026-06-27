import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth();
  if (error || !session) return error!;

  try {
    await prisma.leituraAviso.upsert({
      where: { avisoId_userId: { avisoId: params.id, userId: session.user.id } },
      create: { avisoId: params.id, userId: session.user.id },
      update: { lidoEm: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Aviso não encontrado" }, { status: 404 });
  }
}
