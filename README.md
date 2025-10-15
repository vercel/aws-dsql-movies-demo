[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Faws-dsql-movies-demo)

# AWS Aurora DQSL Movies Demo

This demo uses AWS DSQL Postgres with Next.js to fetch movies from the database. It is able to securely connect to DSQL without using hardcoded access tokens through Vercel's [OIDC Federation](https://vercel.com/docs/security/secure-backend-access/oidc).

**Demo:** 

## Caveats

DSQL [does not currently support](https://docs.aws.amazon.com/aurora-dsql/latest/userguide/working-with-postgresql-compatibility-unsupported-features.html):

## Setup

1. Add required environment variables to your vercel project
```
AWS_ROLE_ARN=arn:aws:iam::YOUR_ACCOUNT:role
DB_CLUSTER_ENDPOINT=your-dsql-clusterendpoint
DB_USERNAME=postgres
DB_NAME=postgres
AWS_REGION=us-east-1
```

2. Pull vercel environment variables locally

``bash
vercel env pull
``

3. Install dependencies:
```bash
npm install
```

4. Run migrations to create tables:
```bash
npm run db:migrate
```

5. Seed the database with movie data:
```bash
npm run db:seed
```

6. Start the development server:
```bash
npm run dev
```