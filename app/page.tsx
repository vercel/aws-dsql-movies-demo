import Loading from '@/components/loading';
import { MovieVoting } from '@/components/movie-voting';
import { getMovies } from '@/lib/db/queries';
import { Suspense } from 'react';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ filter: string | undefined }>;
}) {
  // const { filter } = await searchParams;
  const movies = await getMovies();

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Vote for Your Favorite Movies</h1>
      <Suspense fallback={<Loading />}>
        <MovieVoting movies={movies} />
      </Suspense>
    </div>
  );
}
