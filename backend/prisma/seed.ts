import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL || "admin@buffet.com";
  const senha = process.env.ADMIN_SEED_PASSWORD || "admin123";
  const senhaHash = await bcrypt.hash(senha, 10);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: {},
    create: {
      nome: "Administrador",
      email,
      senhaHash,
    },
  });

  console.log(`Admin seed ok: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
