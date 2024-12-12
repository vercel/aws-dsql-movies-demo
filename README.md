[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Faws-dsql-movies-demo)

# AWS Aurora DQSL Movies Demo

This demo uses AWS DSQL Postgres with Next.js to fetch movies from the database. It is able to securely connect to DSQL without using hardcoded access tokens through Vercel's [OIDC Federation](https://vercel.com/docs/security/secure-backend-access/oidc).

**Demo:** https://dsql.vercel.app

## Caveats

DSQL [does not currently support](https://docs.aws.amazon.com/aurora-dsql/latest/userguide/working-with-postgresql-compatibility-unsupported-features.html):

- Extensions
- Re-indexing
- Creating indexes after you add data

DSQL only offers two different regions (US East and US West) while in preview.
