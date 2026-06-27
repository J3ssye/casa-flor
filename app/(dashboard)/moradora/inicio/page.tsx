import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { atualizarAtrasados } from "@/lib/escala";
import DivisorFloral from "@/components/ui/floral/DivisorFloral";

export default async function InicioPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  await atualizarAtrasados();

  const hoje = new Date();
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;

  const [tarefasHoje, tarefasAtrasadas, avisosNaoLidos, minhasCompras] = await Promise.all([
    // Tarefas pendentes que começaram e ainda não venceram
    prisma.escalaItem.findMany({
      where: {
        userId: session.user.id,
        status: "PENDENTE",
        dataInicio: { lte: hoje },
        dataFim: { gte: hoje },
      },
      include: { tarefa: { include: { area: { select: { nome: true } } } } },
    }),
    // Tarefas atrasadas
    prisma.escalaItem.findMany({
      where: { userId: session.user.id, status: "ATRASADA" },
      include: { tarefa: { include: { area: { select: { nome: true } } } } },
      take: 5,
    }),
    // Avisos que ainda não foram lidos por esta moradora
    prisma.aviso.findMany({
      where: {
        OR: [{ dataValidade: null }, { dataValidade: { gte: hoje } }],
        leituras: { none: { userId: session.user.id } },
      },
      orderBy: { criadoEm: "desc" },
      take: 3,
      select: { id: true, titulo: true, criadoEm: true },
    }),
    // Total gasto por mim no mês (compras compartilhadas)
    prisma.despesa.aggregate({
      where: {
        pagadorId: session.user.id,
        mesReferencia: mesAtual,
        categoria: { not: "ALUGUEL" },
      },
      _sum: { valor: true },
    }),
  ]);

  const totalGastoMes = Number(minhasCompras._sum.valor ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="font-script text-3xl text-primary-700">
          Olá, {session.user.name?.split(" ")[0]} 🌸
        </p>
        <p className="text-primary-500 text-sm mt-0.5">
          {hoje.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      <DivisorFloral />

      {/* Tarefas atrasadas */}
      {tarefasAtrasadas.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <p className="font-semibold text-red-700 mb-2">
            ⚠️ {tarefasAtrasadas.length} tarefa{tarefasAtrasadas.length > 1 ? "s atrasadas" : " atrasada"}
          </p>
          <div className="space-y-1">
            {tarefasAtrasadas.map((t) => (
              <div key={t.id} className="flex items-center justify-between">
                <span className="text-sm text-red-700">{t.tarefa.titulo}</span>
                <Badge variant="red">Atrasada</Badge>
              </div>
            ))}
          </div>
          <Link
            href="/moradora/tarefas"
            className="block mt-3 text-sm text-red-600 font-medium hover:underline"
          >
            Ver e atualizar →
          </Link>
        </Card>
      )}

      {/* Tarefas de hoje */}
      <Card>
        <p className="font-semibold text-gray-800 mb-3">Tarefas de hoje</p>
        {tarefasHoje.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma tarefa para hoje. 🎉</p>
        ) : (
          <div className="space-y-2">
            {tarefasHoje.map((t) => (
              <div key={t.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{t.tarefa.titulo}</p>
                  <p className="text-xs text-gray-400">{t.tarefa.area.nome}</p>
                </div>
                <Badge variant="yellow">Pendente</Badge>
              </div>
            ))}
            <Link
              href="/moradora/tarefas"
              className="block mt-2 text-sm text-primary-600 font-medium hover:underline"
            >
              Ver e atualizar →
            </Link>
          </div>
        )}
      </Card>

      {/* Avisos não lidos */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-gray-800">Avisos não lidos</p>
          {avisosNaoLidos.length > 0 && (
            <Badge variant="red">{avisosNaoLidos.length}</Badge>
          )}
        </div>
        {avisosNaoLidos.length === 0 ? (
          <p className="text-gray-500 text-sm">Você está em dia com os avisos. ✓</p>
        ) : (
          <div className="space-y-2">
            {avisosNaoLidos.map((a) => (
              <div key={a.id} className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">•</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{a.titulo}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(a.criadoEm).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            ))}
            <Link
              href="/moradora/avisos"
              className="block mt-2 text-sm text-primary-600 font-medium hover:underline"
            >
              Ler e confirmar →
            </Link>
          </div>
        )}
      </Card>

      {/* Resumo de compras do mês */}
      <Card>
        <p className="font-semibold text-gray-800 mb-1">
          Minhas compras — {mesAtual}
        </p>
        <p className="text-2xl font-bold text-gray-900">
          R$ {totalGastoMes.toFixed(2)}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          Total registrado por você este mês
        </p>
        <Link
          href="/moradora/financeiro"
          className="block mt-3 text-sm text-primary-600 font-medium hover:underline"
        >
          Ver lançamentos →
        </Link>
      </Card>
    </div>
  );
}
