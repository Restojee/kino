import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES: Array<{ slug: string; name: string; image: string }> = [
  { slug: 'movies',   name: 'Фильмы',      image: '/static/categories/movies.png' },
  { slug: 'series',   name: 'Сериалы',     image: '/static/categories/series.png' },
  { slug: 'cartoons', name: 'Мультфильмы', image: '/static/categories/cartoons.png' },
  { slug: 'anime',    name: 'Аниме',       image: '/static/categories/anime.png' },
];

const GENRES: Array<{ slug: string; name: string }> = [
  { slug: 'sf',        name: 'Фантастика' },
  { slug: 'drama',     name: 'Драма' },
  { slug: 'adventure', name: 'Приключения' },
  { slug: 'action',    name: 'Боевик' },
  { slug: 'thriller',  name: 'Триллер' },
  { slug: 'fantasy',   name: 'Фэнтези' },
  { slug: 'animation', name: 'Мультфильм' },
];

type SeedMovie = {
  title: string;
  originalTitle?: string;
  categorySlug: string;
  year?: number;
  runtimeMinutes?: number;
  country?: string;
  director?: string;
  ageRating?: string;
  description?: string;
  posterUrl?: string;
  genreSlugs?: string[];
  imdbRating?: number;
  imdbVotes?: number;
  kinopoiskRating?: number;
  kinopoiskVotes?: number;
  tmdbRating?: number;
  tmdbVotes?: number;
};

const MOVIES: SeedMovie[] = [
  {
    title: 'Интерстеллар',
    originalTitle: 'Interstellar',
    categorySlug: 'movies',
    year: 2014,
    runtimeMinutes: 169,
    country: 'США, Великобритания',
    director: 'Кристофер Нолан',
    ageRating: '12+',
    description: 'Команда астронавтов отправляется через червоточину в поисках новой планеты, способной принять человечество.',
    posterUrl: '/static/posters/interstellar.jpg',
    genreSlugs: ['sf', 'drama', 'adventure'],
    imdbRating: 8.7,      imdbVotes:      1_900_000,
    kinopoiskRating: 8.6, kinopoiskVotes:   980_000,
    tmdbRating: 8.4,      tmdbVotes:         32_000,
  },
  {
    title: 'Дюна',
    originalTitle: 'Dune',
    categorySlug: 'movies',
    year: 2021,
    runtimeMinutes: 155,
    country: 'США, Канада',
    director: 'Дени Вильнёв',
    ageRating: '16+',
    description: 'Пол Атрейдес должен отправиться на самую опасную планету во вселенной.',
    posterUrl: '/static/posters/dune.jpg',
    genreSlugs: ['sf', 'adventure', 'drama'],
    imdbRating: 8.0,      imdbVotes:      840_000,
    kinopoiskRating: 7.9, kinopoiskVotes: 520_000,
    tmdbRating: 7.8,      tmdbVotes:       18_500,
  },
  {
    title: 'Аркейн',
    originalTitle: 'Arcane',
    categorySlug: 'series',
    year: 2021,
    runtimeMinutes: 41,
    country: 'США, Франция',
    director: 'Паскаль Шарруэ',
    ageRating: '16+',
    description: 'Сёстры Вай и Паудер оказываются по разные стороны войны Пилтовера и Зауна.',
    posterUrl: '/static/posters/arcane.jpg',
    genreSlugs: ['animation', 'action', 'drama', 'fantasy'],
    imdbRating: 9.0,      imdbVotes:      360_000,
    kinopoiskRating: 8.9, kinopoiskVotes: 280_000,
    tmdbRating: 8.7,      tmdbVotes:       11_000,
  },
];

async function main() {
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where:  { slug: c.slug },
      update: { name: c.name, image: c.image },
      create: c,
    });
  }

  for (const g of GENRES) {
    await prisma.genre.upsert({
      where:  { slug: g.slug },
      update: { name: g.name },
      create: g,
    });
  }

  for (const m of MOVIES) {
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: m.categorySlug } });
    const genreIds = m.genreSlugs
      ? await Promise.all(
          m.genreSlugs.map(async (slug) =>
            (await prisma.genre.findUniqueOrThrow({ where: { slug } })).id,
          ),
        )
      : [];

    const data: Prisma.MovieUncheckedCreateInput = {
      categoryId:     category.id,
      title:          m.title,
      originalTitle:  m.originalTitle,
      description:    m.description,
      year:           m.year,
      runtimeMinutes: m.runtimeMinutes,
      country:        m.country,
      director:       m.director,
      ageRating:      m.ageRating,
      posterUrl:      m.posterUrl,
      imdbRating:      m.imdbRating      != null ? new Prisma.Decimal(m.imdbRating)      : null,
      imdbVotes:       m.imdbVotes,
      kinopoiskRating: m.kinopoiskRating != null ? new Prisma.Decimal(m.kinopoiskRating) : null,
      kinopoiskVotes:  m.kinopoiskVotes,
      tmdbRating:      m.tmdbRating      != null ? new Prisma.Decimal(m.tmdbRating)      : null,
      tmdbVotes:       m.tmdbVotes,
    };

    const existing = await prisma.movie.findFirst({ where: { title: m.title } });
    const movie = existing
      ? await prisma.movie.update({ where: { id: existing.id }, data })
      : await prisma.movie.create({ data });

    await prisma.movieGenre.deleteMany({ where: { movieId: movie.id } });
    if (genreIds.length > 0) {
      await prisma.movieGenre.createMany({
        data: genreIds.map((genreId) => ({ movieId: movie.id, genreId })),
      });
    }
  }

  console.log(`Seed complete: ${CATEGORIES.length} categories, ${GENRES.length} genres, ${MOVIES.length} movies`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
