# shadcn/ui monorepo template

This is a Next.js monorepo template with shadcn/ui.

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button";
```

## Local Postgres

This repo includes a local Postgres setup in [`docker-compose.yml`](/Users/ipalace/mywork/nextjs/tally-erp-web/docker-compose.yml).

Start it with:

```bash
docker compose up -d
```

Stop it with:

```bash
docker compose down
```

The default database matches `.env.example`:

```bash
DATABASE_URL=postgresql://user:password@localhost:5433/tally_erp
```

## Docker App + DB

You can now run both the Next.js app and Postgres in containers.

Fresh database with schema but no app data:

```bash
pnpm docker:up:clean
```

Fresh database with schema only:

```bash
pnpm docker:up:schema
```

Fresh database with schema and demo data:

```bash
pnpm docker:up:seeded
```

The helper scripts reset the existing Docker volume first, so each mode starts from a known state.

In Docker-local mode, email verification is disabled by default so sign-up works without a real email provider. You can turn it back on by setting `AUTH_REQUIRE_EMAIL_VERIFICATION=true` and `NEXT_PUBLIC_AUTH_REQUIRE_EMAIL_VERIFICATION=true` together with a real `RESEND_API_KEY`.

The seeded mode prepares these default credentials:

```bash
email: demo@example.com
password: password123
company: Acme Corp Ltd
```

You can override the container settings with environment variables before starting the stack, for example:

```bash
DEMO_USER_EMAIL=owner@example.com DEMO_USER_PASSWORD=supersecret pnpm docker:up:seeded
```

Useful commands:

```bash
pnpm docker:logs
pnpm docker:down
```
