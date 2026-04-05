FROM node:22-bookworm-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable
RUN apt-get update \
  && apt-get install -y --no-install-recommends postgresql-client \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/web-e2e/package.json apps/web-e2e/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN pnpm install --frozen-lockfile

COPY . .

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=postgresql://user:password@postgres:5432/tally_erp
ENV BETTER_AUTH_SECRET=docker-local-secret-please-change-me-32
ENV BETTER_AUTH_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV AUTH_REQUIRE_EMAIL_VERIFICATION=false
ENV NEXT_PUBLIC_AUTH_REQUIRE_EMAIL_VERIFICATION=false
ENV RESEND_API_KEY=re_local_dummy
ENV EMAIL_FROM="Tally ERP <noreply@example.com>"

RUN pnpm --filter web build

EXPOSE 3000

ENTRYPOINT ["./docker/web/entrypoint.sh"]
CMD ["pnpm", "--filter", "web", "start"]
