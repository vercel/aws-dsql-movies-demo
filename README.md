# AWS Aurora DQSL Movies Demo

This demo uses AWS DSQL Postgres with Next.js to fetch movies from the database. It is able to securely connect to DSQL without using hardcoded access tokens through Vercel's [OIDC Federation](https://vercel.com/docs/security/secure-backend-access/oidc).

[![This is an alt text.](/public/Vercel-AWS-GitHub-DSQL.png)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Faws-dsql-movies-demo&project-name=aws-dsql-movies-demo&repository-name=aws-dsql-movies-demo&products=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22aws%22%2C%22productSlug%22%3A%22aws-dsql%22%2C%22protocol%22%3A%22storage%22%7D%5D)

**Demo:**
QQQQQQ
[View Demo](https://dsql.vercel.app/)

**Getting Started:**
Click the "Deploy" button to clone this repo, create a new Vercel project, setup the AWS integration, and provision a new DSQL database:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Faws-dsql-movies-demo&project-name=aws-dsql-movies-demo&repository-name=aws-dsql-movies-demo&products=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22aws%22%2C%22productSlug%22%3A%22aws-dsql%22%2C%22protocol%22%3A%22storage%22%7D%5D)

Once the process is complete, you can clone the newly created GitHub repository and start making changes locally.

## Local Setup

1. Pull vercel environment variables locally

```bash
vercel env pull
```

2. Install dependencies:

```bash
pnpm install
```

3. Run migrations to create tables:

```bash
pnpm run db:migrate
```

4. Seed the database with movie data:

```bash
pnpm run db:seed
```

5. Start the development server:

```bash
pnpm run dev
```
