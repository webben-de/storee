FROM node:20-bookworm-slim

WORKDIR /app
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN apt-get update \
	&& apt-get install -y --no-install-recommends openssl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

RUN corepack enable

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm prisma generate --schema=prisma/schema.prisma
RUN pnpm nx run api:build:production

EXPOSE 3000

CMD ["sh", "-lc", "pnpm prisma db push --schema=prisma/schema.prisma && node dist/apps/api/main.js"]
