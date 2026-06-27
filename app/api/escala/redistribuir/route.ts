import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/permissions";
import { redistribuirTarefas } from "@/lib/escala";

// Admin redistribui todas as tarefas pendentes de uma moradora que saiu
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 });

  const redistribuidos = await redistribuirTarefas(userId);
  return NextResponse.json({ redistribuidos });
}
