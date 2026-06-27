import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const mes = searchParams.get("mes"); // YYYY-MM

  const where = mes ? { mesReferencia: mes } : {};

  const [moradoras, despesas] = await Promise.all([
    prisma.user.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
    }),
    prisma.despesa.findMany({
      where,
      select: { valor: true, pagadorId: true },
    }),
  ]);

  const totalGeral = despesas.reduce((acc, d) => acc + Number(d.valor), 0);

  // Divisão igual entre todas as moradoras ativas
  const n = moradoras.length;
  const deveria = n > 0 ? totalGeral / n : 0;

  const resultado = moradoras.map((m) => {
    const pagou = despesas
      .filter((d) => d.pagadorId === m.id)
      .reduce((acc, d) => acc + Number(d.valor), 0);

    const saldo = pagou - deveria; // positivo = tem a receber; negativo = deve

    return {
      id: m.id,
      nome: m.nome,
      pagou: Number(pagou.toFixed(2)),
      deveria: Number(deveria.toFixed(2)),
      saldo: Number(saldo.toFixed(2)),
    };
  });

  return NextResponse.json({
    mes,
    totalGeral: Number(totalGeral.toFixed(2)),
    moradoras: resultado,
  });
}
