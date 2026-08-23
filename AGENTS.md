# VenturAssist — AGENTS.md

VenturAssist is a Next.js application for venture-capital due diligence. It stores application data through Prisma and PostgreSQL, uploads source documents to Cloudflare R2, and coordinates Gemini-powered analysis workers with BullMQ and Redis.

## Non-Negotiable Core Principles

- Keep authentication, startup records, source documents, queued jobs, and generated analyses scoped to the owning user and startup.
- Keep HTTP routes thin; put queue orchestration, analysis, storage, and external-service behavior in the existing server and library boundaries.
- Treat database, object-storage, AI, and authentication credentials as secrets. Keep them in ignored environment files and never log their values.
- Preserve job-state transitions and make worker operations safe to retry before extending the analysis pipeline.
- Prefer clear, typed domain states and Zod validation at untrusted boundaries over assertions or loosely shaped data.

## Note

User instructions take precedence. Keep changes focused and reversible, preserve the established Next.js and component patterns, and do not alter hosted resources or shared external data without explicit authorization. Generated Prisma client files and build artifacts are outputs, not source documentation.

## Project Glossary

- **Startup**: A user-owned due-diligence project and the root of its source data, jobs, and analyses.
- **Data source**: An uploaded file, text submission, or URL analyzed for a startup.
- **Ingestion worker**: Extracts and stores structured facts from source documents.
- **RedLens**: Produces the multi-discipline risk assessment.
- **Competitor analysis**: Produces market and competitor findings.
- **Analysis job**: A BullMQ task whose lifecycle is also recorded in PostgreSQL.
- **R2**: Cloudflare object storage used for uploaded files.

## Development & Execution Rules

- Use pnpm; `pnpm-lock.yaml` and the README define the project workflow. Do not update `package-lock.json` unless intentionally standardizing package managers.
- Use Node.js 20 or newer. Install with `pnpm install --frozen-lockfile`.
- Keep local secrets in the ignored root `.env`. Next.js and the standalone workers must resolve the same variables.
- Start Redis with `docker compose up -d redis`. Do not stop or modify unrelated containers.
- Generate the Prisma client with `pnpm prisma generate`. Treat `prisma db push`, migrations, and external database writes as explicit schema operations, not routine startup steps.
- Run this checkout with `PORT=3003 pnpm dev`; ports 3000–3002 may belong to other local projects, and Next.js does not read `PORT` from `.env` during server bootstrap. Run workers separately with `pnpm worker:ingestion`, `pnpm worker:redlens`, and `pnpm worker:competitor`.
- Validate changes with `pnpm lint`, `pnpm exec tsc --noEmit`, focused tests where present, and `pnpm build` in proportion to risk.
- Keep routes and UI under `src/app`, reusable UI under `src/components`, shared clients under `src/lib`, queue implementation under `src/server/bullmq`, and executable worker entry points under `src/workers`.
- Update `README.md`, `example.env`, and relevant documentation when setup, commands, required environment variables, routes, or visible behavior changes.
