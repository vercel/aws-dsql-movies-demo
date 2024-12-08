import Explanation from '@/components/explanation';
import Loading from '@/components/loading';
import { MovieVoting } from '@/components/movie-voting';
import { getMovies } from '@/lib/db/queries';
import { cookies } from 'next/headers';
import { Suspense } from 'react';

type Props = {
  searchParams: Promise<{ filter: string | undefined }>;
};

export default async function HomePage({ searchParams }: Props) {
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Explanation />
      <Suspense fallback={<Loading />}>
        <Movies searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Movies({ searchParams }: Props) {
  const { filter } = await searchParams;
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('sessionId')?.value;
  const { movies, totalRecords, queryTimeMs } = await getMovies(
    sessionId,
    filter,
  );

  return (
    <MovieVoting
      movies={movies}
      highlight={filter || ''}
      queryTimeMs={queryTimeMs}
      totalRecords={totalRecords}
    />
  );
}
