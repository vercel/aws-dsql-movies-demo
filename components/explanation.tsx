import Link from 'next/link';

export default function Explanation() {
  return (
    <div className="text-gray-800 dark:text-gray-200 text-sm border border-dashed border-gray-300 dark:border-gray-600 p-4 mb-4 font-mono bg-white dark:bg-gray-900">
      <p className="mb-2">
        This app uses <b className="font-bold">AWS DSQL Postgres</b> with
        Next.js and Vercel (
        <Link
          href="https://github.com/vercel/aws-dsql-movies-demo"
          target="_blank"
          rel="noreferrer"
          className="text-gray-900 dark:text-white border-b border-gray-900 dark:border-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          view source
        </Link>
        ).
      </p>

      <details className="group mb-2">
        <summary className="cursor-pointer hover:text-gray-900 dark:hover:text-white">
          <span className="pl-1">How does this work?</span>
        </summary>
        <p className="p-5 mt-2 bg-gray-100 dark:bg-gray-800">
          Movies are fetched from the Postgres database when the page loads. It
          has been seeded with the top 5000 movies from{' '}
          <Link
            href="https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata"
            target="_blank"
            rel="noreferrer"
            className="text-gray-900 dark:text-white border-b border-gray-900 dark:border-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            TMDB.
          </Link>{' '}
          When a user votes on a movie,{' '}
          <code className="bg-gray-200 dark:bg-gray-700 px-1">
            useOptimistic
          </code>{' '}
          is used to instantly show the new score and updated time.
        </p>
      </details>

      <details className="group">
        <summary className="cursor-pointer hover:text-gray-900 dark:hover:text-white">
          <span className="pl-1">
            How is DSQL different from other databases?
          </span>
        </summary>
        <p className="p-5 mt-2 bg-gray-100 dark:bg-gray-800">
          Our DSQL database is replicated to multiple regions with{' '}
          <em className="text-gray-900 dark:text-gray-100 not-italic">
            strong consistency
          </em>
          . Currently, DSQL only offers two different regions (US East and US
          West) while in preview. DSQL is ACID, severless and scales to zero,
          and separates storage from compute. It also has 99.99% availability in
          single-region configuration and 99.999% in multi-region.{' '}
          <Link
            href="https://aws.amazon.com/blogs/database/introducing-amazon-aurora-dsql/"
            target="_blank"
            rel="noreferrer"
            className="text-gray-900 dark:text-white border-b border-gray-900 dark:border-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Learn more.
          </Link>
        </p>
      </details>
    </div>
  );
}
