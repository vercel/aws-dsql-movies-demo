'use client';

import { useOptimistic, useTransition, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Movie } from '@/lib/db/queries';
import { voteAction } from '@/lib/db/actions';
import { Search } from './search';
import { cn } from '@/lib/utils';

export function highlightMatch(text: string, highlight: string) {
  if (!highlight.trim()) {
    return text;
  }
  const regex = new RegExp(`(${highlight})`, 'gi');
  return text.replace(
    regex,
    '<span class="bg-yellow-300 dark:bg-yellow-700">$1</span>',
  );
}

interface MovieVotingProps {
  movies: Movie[];
  highlight: string;
  queryTimeMs: string;
}

function formatTimeAgo(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

type MovieState = {
  movies: Movie[];
  filter: string;
};

export function MovieVoting({
  movies: initialMovies,
  highlight,
  queryTimeMs,
}: MovieVotingProps) {
  const [_, startTransition] = useTransition();

  const [state, mutate] = useOptimistic(
    { movies: initialMovies, filter: highlight },
    function reducer(state, newState: MovieState) {
      return { ...newState };
    },
  );

  const sortedAndFilteredMovies = useMemo(() => {
    let result = [...state.movies];
    result.sort((a, b) => b.score - a.score);

    if (state.filter) {
      const lowercasedFilter = state.filter.toLowerCase();
      result = result.filter((movie) =>
        movie.title.toLowerCase().includes(lowercasedFilter),
      );
    }

    return result;
  }, [state.movies, state.filter]);

  const handleFilterChange = (newFilter: string) => {
    startTransition(() => {
      mutate({
        movies: state.movies,
        filter: newFilter,
      });
    });
  };

  const handleVote = async (movie: Movie, voteType: 'up' | 'down') => {
    startTransition(async () => {
      const updatedMovie: Movie = {
        ...movie,
        score: movie.score + (voteType === 'up' ? 1 : -1),
        lastVoteTime: new Date(),
        hasVoted: true,
      };

      mutate({
        movies: state.movies.map((m) => (m.id === movie.id ? updatedMovie : m)),
        filter: state.filter,
      });

      await voteAction(movie, updatedMovie.score, updatedMovie.lastVoteTime);
    });
  };

  return (
    <div className="space-y-4">
      <Search inputValue={state.filter} onChange={handleFilterChange} />

      <ul className="space-y-2">
        {sortedAndFilteredMovies.map((movie) => (
          <li
            key={movie.id}
            className="text-black dark:text-white flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-900 rounded"
          >
            <div className="flex items-center flex-grow">
              <div className="flex items-center space-x-1 mr-3 mb-auto md:mb-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleVote(movie, 'up')}
                  className={cn('p-0 h-6 w-6', movie.hasVoted && '!opacity-10')}
                  aria-label={`Upvote ${movie.title}`}
                  disabled={movie.hasVoted}
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <span className="text-sm font-bold min-w-[2ch] text-center">
                  {movie.score}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleVote(movie, 'down')}
                  className={cn('p-0 h-6 w-6', movie.hasVoted && '!opacity-10')}
                  aria-label={`Downvote ${movie.title}`}
                  disabled={movie.hasVoted}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
              <span
                className="flex-grow"
                dangerouslySetInnerHTML={{
                  __html: highlightMatch(movie.title, state.filter),
                }}
              />
            </div>
            <span className="md:flex hidden text-xs text-gray-400 ml-2">
              {formatTimeAgo(new Date(movie.lastVoteTime))}
            </span>
          </li>
        ))}
      </ul>
      {sortedAndFilteredMovies.length === 0 ? (
        <p className="text-center text-gray-500">No movies found</p>
      ) : (
        <p className="text-xs italic">
          Fetched {initialMovies.length} movies in {queryTimeMs}
          ms
        </p>
      )}
    </div>
  );
}
