'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Movie {
  id: number;
  title: string;
  upvotes: number;
  downvotes: number;
  lastVoteTime: Date;
}

interface MovieVotingProps {
  movies: Movie[];
  initialFilter: string;
}

function highlightMatch(text: string, highlight: string) {
  if (!highlight.trim()) {
    return text;
  }
  const regex = new RegExp(`(${highlight})`, 'gi');
  return text.replace(regex, '<span class="bg-yellow-200">$1</span>');
}

function formatTimeAgo(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export function MovieVoting({ movies, initialFilter }: MovieVotingProps) {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsLoading(false);
  }, [movies]);

  const updateURL = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('filter', value);
    } else {
      params.delete('filter');
    }
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilter = e.target.value;
    setIsLoading(true);
    updateURL(newFilter);
  };

  const handleUpvote = (id: number) => {
    startTransition(() => {
      // Here you would typically make an API call to update the vote
      console.log(`Upvoted movie with id: ${id}`);
      // For now, we'll just refresh the page to simulate the update
      router.refresh();
    });
  };

  const handleDownvote = (id: number) => {
    startTransition(() => {
      // Here you would typically make an API call to update the vote
      console.log(`Downvoted movie with id: ${id}`);
      // For now, we'll just refresh the page to simulate the update
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="Search movies..."
        onChange={handleFilterChange}
        defaultValue={searchParams.get('filter') || ''}
        className="w-full"
      />
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-100 rounded"
            >
              <div className="flex items-center flex-grow">
                <div className="flex items-center space-x-1 mr-3">
                  <Skeleton className="h-6 w-6 rounded" />
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-6 w-6 rounded" />
                </div>
                <Skeleton className="h-4 w-full max-w-[200px]" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {movies.map((movie) => (
            <li
              key={movie.id}
              className="flex items-center justify-between p-2 bg-gray-100 rounded"
            >
              <div className="flex items-center flex-grow">
                <div className="flex items-center space-x-1 mr-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUpvote(movie.id)}
                    disabled={isPending}
                    className="p-0 h-6 w-6"
                    aria-label={`Upvote ${movie.title}`}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-bold min-w-[2ch] text-center">
                    {movie.upvotes - movie.downvotes}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownvote(movie.id)}
                    disabled={isPending}
                    className="p-0 h-6 w-6"
                    aria-label={`Downvote ${movie.title}`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
                <span
                  className="flex-grow"
                  dangerouslySetInnerHTML={{ __html: movie.title }}
                />
              </div>
              <span className="text-xs text-gray-400 ml-2">
                {formatTimeAgo(new Date(movie.lastVoteTime))}
              </span>
            </li>
          ))}
        </ul>
      )}
      {!isLoading && movies.length === 0 && (
        <p className="text-center text-gray-500">No movies found</p>
      )}
    </div>
  );
}
