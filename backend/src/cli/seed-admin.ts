import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Admin';

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in env');
  }

  const defaults = [
    { slug: 'movies', name: 'Фильмы' },
    { slug: 'series', name: 'Сериалы' },
    { slug: 'cartoons', name: 'Мультфильмы' },
    { slug: 'anime', name: 'Аниме' },
  ];
  for (const d of defaults) {
    await prisma.category.upsert({ where: { slug: d.slug }, update: {}, create: d });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== 'admin') {
      await prisma.user.update({ where: { id: existing.id }, data: { role: 'admin' } });
      console.log(`Promoted ${email} to admin.`);
    } else {
      console.log(`Admin ${email} already exists.`);
    }
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { email, passwordHash, name, role: 'admin' } });
    console.log(`Admin ${email} created.`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
