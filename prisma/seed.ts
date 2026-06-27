import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const nome = process.env.SEED_ADMIN_NOME;
  const email = process.env.SEED_ADMIN_EMAIL;
  const senha = process.env.SEED_ADMIN_SENHA;

  if (!nome || !email || !senha) {
    throw new Error(
      "Defina SEED_ADMIN_NOME, SEED_ADMIN_EMAIL e SEED_ADMIN_SENHA no .env antes de rodar o seed."
    );
  }

  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) {
    console.log(`Admin já existe: ${email} — seed ignorado.`);
    return;
  }

  const hash = await bcrypt.hash(senha, 12);

  const admin = await prisma.user.create({
    data: {
      nome,
      email,
      senha: hash,
      role: "ADMIN",
    },
  });

  console.log(`✓ Admin criada: ${admin.nome} <${admin.email}>`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
