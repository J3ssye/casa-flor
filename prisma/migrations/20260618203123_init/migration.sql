-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MORADORA');

-- CreateEnum
CREATE TYPE "Periodicidade" AS ENUM ('DIARIA', 'SEMANAL', 'QUINZENAL', 'MENSAL');

-- CreateEnum
CREATE TYPE "StatusEscala" AS ENUM ('PENDENTE', 'CONCLUIDA', 'ATRASADA');

-- CreateEnum
CREATE TYPE "StatusReclamacao" AS ENUM ('ABERTA', 'EM_ANALISE', 'RESOLVIDA');

-- CreateEnum
CREATE TYPE "CategoriaReclamacao" AS ENUM ('LIMPEZA', 'BARULHO', 'CONVIVENCIA', 'FINANCEIRO', 'INFRAESTRUTURA', 'OUTRO');

-- CreateEnum
CREATE TYPE "CategoriaDespesa" AS ENUM ('MERCADO', 'LIMPEZA', 'AGUA', 'LUZ', 'GAS', 'INTERNET', 'MANUTENCAO', 'OUTRO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MORADORA',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "pesoRateio" DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "periodicidadeLimpeza" "Periodicidade" NOT NULL DEFAULT 'SEMANAL',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tarefa" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "periodicidade" "Periodicidade" NOT NULL DEFAULT 'SEMANAL',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "areaId" TEXT NOT NULL,

    CONSTRAINT "Tarefa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscalaItem" (
    "id" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "status" "StatusEscala" NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "tarefaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "EscalaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConclusaoTarefa" (
    "id" TEXT NOT NULL,
    "dataConclusao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacao" TEXT,
    "escalaItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ConclusaoTarefa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aviso" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "dataValidade" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "autorId" TEXT NOT NULL,

    CONSTRAINT "Aviso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeituraAviso" (
    "id" TEXT NOT NULL,
    "lidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avisoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "LeituraAviso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reclamacao" (
    "id" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "categoria" "CategoriaReclamacao" NOT NULL DEFAULT 'OUTRO',
    "anonima" BOOLEAN NOT NULL DEFAULT false,
    "status" "StatusReclamacao" NOT NULL DEFAULT 'ABERTA',
    "respostaAdmin" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "autorId" TEXT NOT NULL,

    CONSTRAINT "Reclamacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Despesa" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "categoria" "CategoriaDespesa" NOT NULL DEFAULT 'OUTRO',
    "dataDespesa" TIMESTAMP(3) NOT NULL,
    "mesReferencia" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "pagadorId" TEXT NOT NULL,

    CONSTRAINT "Despesa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateioConfig" (
    "id" TEXT NOT NULL,
    "peso" DECIMAL(5,2) NOT NULL,
    "vigenciaDe" TIMESTAMP(3) NOT NULL,
    "vigenciaAte" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "RateioConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemCompra" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "quantidade" TEXT,
    "comprado" BOOLEAN NOT NULL DEFAULT false,
    "criadoPor" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemCompra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgendaLavanderia" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "duracao" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgendaLavanderia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitacaoTroca" (
    "id" TEXT NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "escalaItemId" TEXT NOT NULL,
    "candidataId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolicitacaoTroca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_ativo_idx" ON "User"("ativo");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Area_ativo_idx" ON "Area"("ativo");

-- CreateIndex
CREATE INDEX "Tarefa_areaId_idx" ON "Tarefa"("areaId");

-- CreateIndex
CREATE INDEX "Tarefa_ativo_idx" ON "Tarefa"("ativo");

-- CreateIndex
CREATE INDEX "EscalaItem_tarefaId_idx" ON "EscalaItem"("tarefaId");

-- CreateIndex
CREATE INDEX "EscalaItem_userId_idx" ON "EscalaItem"("userId");

-- CreateIndex
CREATE INDEX "EscalaItem_status_idx" ON "EscalaItem"("status");

-- CreateIndex
CREATE INDEX "EscalaItem_dataInicio_dataFim_idx" ON "EscalaItem"("dataInicio", "dataFim");

-- CreateIndex
CREATE UNIQUE INDEX "ConclusaoTarefa_escalaItemId_key" ON "ConclusaoTarefa"("escalaItemId");

-- CreateIndex
CREATE INDEX "ConclusaoTarefa_userId_idx" ON "ConclusaoTarefa"("userId");

-- CreateIndex
CREATE INDEX "ConclusaoTarefa_dataConclusao_idx" ON "ConclusaoTarefa"("dataConclusao");

-- CreateIndex
CREATE INDEX "Aviso_autorId_idx" ON "Aviso"("autorId");

-- CreateIndex
CREATE INDEX "Aviso_criadoEm_idx" ON "Aviso"("criadoEm");

-- CreateIndex
CREATE INDEX "Aviso_dataValidade_idx" ON "Aviso"("dataValidade");

-- CreateIndex
CREATE INDEX "LeituraAviso_userId_idx" ON "LeituraAviso"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LeituraAviso_avisoId_userId_key" ON "LeituraAviso"("avisoId", "userId");

-- CreateIndex
CREATE INDEX "Reclamacao_status_idx" ON "Reclamacao"("status");

-- CreateIndex
CREATE INDEX "Reclamacao_anonima_idx" ON "Reclamacao"("anonima");

-- CreateIndex
CREATE INDEX "Reclamacao_criadoEm_idx" ON "Reclamacao"("criadoEm");

-- CreateIndex
CREATE INDEX "Despesa_pagadorId_idx" ON "Despesa"("pagadorId");

-- CreateIndex
CREATE INDEX "Despesa_dataDespesa_idx" ON "Despesa"("dataDespesa");

-- CreateIndex
CREATE INDEX "Despesa_mesReferencia_idx" ON "Despesa"("mesReferencia");

-- CreateIndex
CREATE INDEX "Despesa_categoria_idx" ON "Despesa"("categoria");

-- CreateIndex
CREATE INDEX "RateioConfig_userId_idx" ON "RateioConfig"("userId");

-- CreateIndex
CREATE INDEX "RateioConfig_vigenciaDe_vigenciaAte_idx" ON "RateioConfig"("vigenciaDe", "vigenciaAte");

-- CreateIndex
CREATE INDEX "ItemCompra_comprado_idx" ON "ItemCompra"("comprado");

-- CreateIndex
CREATE INDEX "AgendaLavanderia_dataHora_idx" ON "AgendaLavanderia"("dataHora");

-- CreateIndex
CREATE INDEX "AgendaLavanderia_userId_idx" ON "AgendaLavanderia"("userId");

-- CreateIndex
CREATE INDEX "SolicitacaoTroca_solicitanteId_idx" ON "SolicitacaoTroca"("solicitanteId");

-- CreateIndex
CREATE INDEX "SolicitacaoTroca_status_idx" ON "SolicitacaoTroca"("status");

-- AddForeignKey
ALTER TABLE "Tarefa" ADD CONSTRAINT "Tarefa_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalaItem" ADD CONSTRAINT "EscalaItem_tarefaId_fkey" FOREIGN KEY ("tarefaId") REFERENCES "Tarefa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalaItem" ADD CONSTRAINT "EscalaItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConclusaoTarefa" ADD CONSTRAINT "ConclusaoTarefa_escalaItemId_fkey" FOREIGN KEY ("escalaItemId") REFERENCES "EscalaItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConclusaoTarefa" ADD CONSTRAINT "ConclusaoTarefa_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aviso" ADD CONSTRAINT "Aviso_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeituraAviso" ADD CONSTRAINT "LeituraAviso_avisoId_fkey" FOREIGN KEY ("avisoId") REFERENCES "Aviso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeituraAviso" ADD CONSTRAINT "LeituraAviso_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reclamacao" ADD CONSTRAINT "Reclamacao_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Despesa" ADD CONSTRAINT "Despesa_pagadorId_fkey" FOREIGN KEY ("pagadorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateioConfig" ADD CONSTRAINT "RateioConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
