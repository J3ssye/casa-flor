import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/permissions";
import { gerarEscalaMensal } from "@/lib/escala";

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  // Aceita { mes: "YYYY-MM" } ou usa mês atual
  const ref = body.mes ? new Date(body.mes + "-01") : new Date();

  const criados = await gerarEscalaMensal(ref);
  return NextResponse.json({ criados });
}
