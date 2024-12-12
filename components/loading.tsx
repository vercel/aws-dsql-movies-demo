import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="Search movies..."
        className="w-full"
        disabled
      />
      <ul className="space-y-2">
        {[...Array(8)].map((_, index) => (
          <li
            key={index}
            className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-900 rounded"
          >
            <div className="flex items-center flex-grow">
              <div className="flex items-center space-x-1 mr-3">
                <Skeleton className="h-6 w-6 rounded dark:bg-gray-700" />
                <Skeleton className="h-4 w-8 dark:bg-gray-700" />
                <Skeleton className="h-6 w-6 rounded dark:bg-gray-700" />
              </div>
              <Skeleton className="h-4 w-full max-w-[200px] dark:bg-gray-700" />
            </div>
            <Skeleton className="h-4 w-16 dark:bg-gray-700" />
          </li>
        ))}
      </ul>
    </div>
  );
}
