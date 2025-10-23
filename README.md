[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Faws-dsql-movies-demo)

# AWS Aurora DQSL Movies Demo

This demo uses AWS DSQL Postgres with Next.js to fetch movies from the database. It is able to securely connect to DSQL without using hardcoded access tokens through Vercel's [OIDC Federation](https://vercel.com/docs/security/secure-backend-access/oidc).

**Demo:** 

## Caveats

DSQL [does not currently support](https://docs.aws.amazon.com/aurora-dsql/latest/userguide/working-with-postgresql-compatibility-unsupported-features.html):

## Setup

1. Pull vercel environment variables locally

```bash
vercel env pull
```

2. Install dependencies:

```bash
npm install
```

3. Run migrations to create tables:
```bash
npm run db:migrate
```

4. Seed the database with movie data:
```bash
npm run db:seed
```

5. Start the development server:
```bash
npm run dev
```
