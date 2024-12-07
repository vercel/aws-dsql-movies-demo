'use client';

import { useOptimistic, useTransition, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Movie } from '@/lib/db/queries';
import { voteAction } from '@/lib/db/actions';
import { Search } from './search';

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
      };

      mutate({
        movies: state.movies.map((m) => (m.id === movie.id ? updatedMovie : m)),
        filter: state.filter,
      });

      await voteAction(updatedMovie);
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
              <div className="flex items-center space-x-1 mr-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleVote(movie, 'up')}
                  className="p-0 h-6 w-6"
                  aria-label={`Upvote ${movie.title}`}
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
                  className="p-0 h-6 w-6"
                  aria-label={`Downvote ${movie.title}`}
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
            <span className="text-xs text-gray-400 ml-2">
              {formatTimeAgo(new Date(movie.lastVoteTime))}
            </span>
          </li>
        ))}
      </ul>
      {sortedAndFilteredMovies.length === 0 && (
        <p className="text-center text-gray-500">No movies found</p>
      )}
    </div>
  );
}
