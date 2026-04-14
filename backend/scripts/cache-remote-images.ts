import { PrismaClient } from '@prisma/client';
import { mkdir, writeFile, access } from 'fs/promises';
import { join, extname } from 'path';

const PUBLIC_DIR = join(process.cwd(), 'public');
const prisma = new PrismaClient();

async function cacheRemoteImage(
  url: string | null | undefined,
  subdir: string,
  baseName: string,
): Promise<string | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  try {
    const ext = pickImageExt(url);
    const safeBase = baseName.replace(/[^\w.-]+/g, '_');
    const fileName = `${safeBase}${ext}`;
    const dir = join(PUBLIC_DIR, subdir);
    const filePath = join(dir, fileName);
    const publicPath = `/static/${subdir}/${fileName}`;

    if (await fileExists(filePath)) return publicPath;

    await mkdir(dir, { recursive: true });
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bobkino/1.0)' },
    });
    if (!res.ok) {
      console.warn(`  ! ${res.status} ${url}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(filePath, buf);
    return publicPath;
  } catch (e) {
    console.warn(`  ! error ${url}:`, (e as Error).message);
    return null;
  }
}

function pickImageExt(url: string): string {
  const clean = url.split('?')[0].split('#')[0];
  const e = extname(clean).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(e)) return e;
  return '.jpg';
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const movies = await prisma.movie.findMany({
    where: {
      OR: [
        { posterUrl:   { startsWith: 'http' } },
        { backdropUrl: { startsWith: 'http' } },
      ],
    },
    select: {
      id: true,
      title: true,
      externalSource: true,
      externalId: true,
      posterUrl: true,
      backdropUrl: true,
    },
  });

  console.log(`Found ${movies.length} movies with remote images`);

  let posterCount = 0;
  let backdropCount = 0;

  for (const m of movies) {
    const base = m.externalSource && m.externalId
      ? `${m.externalSource}-${m.externalId}`
      : `movie-${m.id}`;

    console.log(`→ ${m.title}`);

    const localPoster = m.posterUrl?.startsWith('http')
      ? await cacheRemoteImage(m.posterUrl, 'posters', base)
      : null;
    const localBackdrop = m.backdropUrl?.startsWith('http')
      ? await cacheRemoteImage(m.backdropUrl, 'backdrops', base)
      : null;

    const data: { posterUrl?: string; backdropUrl?: string } = {};
    if (localPoster)   { data.posterUrl   = localPoster;   posterCount++; }
    if (localBackdrop) { data.backdropUrl = localBackdrop; backdropCount++; }

    if (Object.keys(data).length > 0) {
      await prisma.movie.update({ where: { id: m.id }, data });
      console.log(`  ✓ ${Object.keys(data).join(', ')}`);
    }
  }

  console.log(`\nDone. Posters: ${posterCount}, Backdrops: ${backdropCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
