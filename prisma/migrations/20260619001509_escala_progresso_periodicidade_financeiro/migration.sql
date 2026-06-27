-- AlterEnum
ALTER TYPE "CategoriaDespesa" ADD VALUE 'ALUGUEL';

-- AlterTable
ALTER TABLE "EscalaItem" ADD COLUMN     "observacaoMoradora" TEXT,
ADD COLUMN     "percentualConclusao" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Tarefa" ADD COLUMN     "vezesNaSemana" INTEGER;
