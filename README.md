# GlobAQI — Global All-platform Quick Integrator

GlobAQI is a local-first social channel workspace prototype. It provides a web UI for user accounts, channel setup, content records, analytics views, CSV reports, and data-based AI suggestions. The implementation is intentionally limited: only some platform OAuth callbacks and data paths are live, and the current publish action changes local state rather than publishing to a social network.

## Current capabilities

- User signup, login, logout, and current-session lookup using an HTTP-only cookie. Local records are scoped to the signed-in user.
- Overview, analytics, content, calendar, reports, AI insights, and settings pages.
- Sample channels for exercising UI flows without connecting an external account.
- Workspace-level platform credential entry. Credentials and OAuth tokens are encrypted before being written to local state.
- OAuth authorization URL creation for the eight platforms shown in Settings. Token exchange and account validation callbacks are implemented for YouTube, Reddit, and X. YouTube also has channel and recent-upload synchronization and YouTube Analytics reads. Reddit and X do not currently have comparable analytics synchronization.
- Content drafts, target account selection, per-account text overrides, validation, and approval/scheduled statuses.
- Local publish and retry status actions. There is no publishing adapter that posts the current content to external networks and no background scheduler that automatically publishes scheduled records.
- Analytics and dashboard data from locally stored records, plus YouTube data when a supported YouTube account is connected.
- Report records and CSV export.
- AI insights using stored records and heuristics. Caption generation calls local Ollama when available and otherwise returns a deterministic local template.

An authorization URL being available for Instagram, Facebook, Threads, TikTok, or LinkedIn does not mean its callback or publishing integration is finished. The callback route rejects live completion for platforms other than YouTube, Reddit, and X. Real provider use may require developer credentials, scopes, account eligibility, and provider review or approval.

## Technology and architecture

| Area | Technology | Implementation |
|---|---|---|
| Monorepo | pnpm workspaces, Turbo | Root scripts and package orchestration. |
| Frontend | Next.js 14 App Router, React 18, TypeScript | `apps/web`; browser UI and API client. |
| API | NestJS 10, TypeScript | `apps/api`; REST controllers and local store. |
| Shared types | `@zpf/shared` | Frontend/API contracts. |
| Current persistence | JSON file | `apps/api/data/local-state.json` when run through the package command. |
| Database foundation | Drizzle, PostgreSQL | `packages/database` schema and tooling; not used by the API runtime. |
| Optional AI | Ollama HTTP API | Local generation; no cloud AI provider is called by the current API. |
| Optional services | Docker Compose, PostgreSQL, Redis, MinIO | Infrastructure scaffold; not required by the current API runtime. |

```text
Browser → Next.js (apps/web, port 3000) → /api → NestJS (apps/api, port 4000)
                                              ├─ LocalStore → JSON state file
                                              ├─ External provider APIs where implemented
                                              └─ Optional local Ollama server

packages/shared    Shared TypeScript contracts
packages/database  Drizzle schema and database command foundation
infra/docker       Optional local service definitions
```

The API globally prefixes routes with `/api`. `LocalStore` resolves `data/local-state.json` relative to the API process working directory; `pnpm --filter @zpf/api ...` runs the API package with `apps/api` as its working directory. A new local store starts with empty users, accounts, posts, and reports.

## Prerequisites

- Node.js 20 or newer.
- Corepack and pnpm 9 (`pnpm@9.0.0` is pinned in the root package manifest).
- macOS, Linux, or Windows. The direct package commands below are suitable for macOS and Linux; the root Turbo runner uses PowerShell.
- Optional: Ollama for local AI generation.
- Optional: Docker Desktop for the scaffolded PostgreSQL, Redis, and MinIO services.
- Optional: external platform developer credentials and any required scopes or approvals.

## Install and run on macOS

**GitHub repository pending:** this project does not yet have a published GitHub clone URL. After creating the repository, replace `<GITHUB_REPOSITORY_URL>` below with its HTTPS or SSH clone URL.

```sh
git clone <GITHUB_REPOSITORY_URL> globaqi
cd globaqi
corepack enable
corepack prepare pnpm@9.0.0 --activate
pnpm install
```

Copy the environment template if you need to configure the optional settings:

```sh
cp .env.example .env
```

The API process reads its settings from its process environment. For zsh, load `.env` in each terminal started at the project root before launching a command:

```sh
set -a
source .env
set +a
```

Run the API and frontend in separate terminals:

```sh
pnpm --filter @zpf/api dev
```

```sh
pnpm --filter @zpf/web dev
```

The web app is at [http://localhost:3000](http://localhost:3000). The API health endpoint is [http://localhost:4000/api/health](http://localhost:4000/api/health).

Use the signup page to create a local user, then add a sample channel or configure an integration under Settings.

## Environment configuration

The API and frontend have defaults for local startup, so no `.env` values are required just to boot them at the default ports. `.env.example` contains the settings read by the current application and platform credential fallbacks:

| Variable(s) | Use and requirement |
|---|---|
| `PORT` | API listen port; defaults to `4000`. |
| `API_URL` | API base used when building OAuth redirect URLs; defaults to `http://localhost:4000`. |
| `CORS_ORIGINS` | Comma-separated CORS origins; defaults to `http://localhost:3000`. |
| `NEXT_PUBLIC_API_URL` | Frontend API base; defaults to `http://localhost:4000/api`. |
| `NODE_ENV` | Adds the `Secure` cookie attribute when set to `production`. |
| `ENCRYPTION_KEY` | Key material for encrypting saved credentials and tokens. The code has a development fallback; set a private, stable value before storing real credentials. |
| `OLLAMA_BASE_URL`, `OLLAMA_MODEL` | Optional Ollama address and model; default to `http://localhost:11434` and `llama3.2`. Without Ollama, captions use a local template. |
| `REDDIT_USER_AGENT` | Optional Reddit request user-agent. |
| Platform credential variables | Optional server-provided client ID/secret fallbacks. The same credentials can be entered per workspace in Settings. See `.env.example` for the exact supported names. |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` | Optional Docker Compose local service settings. Passwords must be replaced with unique local-only values before starting Compose. |
| `PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD` | Optional pgAdmin settings used only with the Compose `tools` profile. |
| `DATABASE_URL` | Required only for the separate Drizzle configuration and database seed tooling. Supply it in the process environment (or `packages/database/.env` for those package commands). The API itself does not use PostgreSQL. |

Social platform connections require provider credentials and may require scopes, developer review, and eligible account types. The current API does not use the cloud AI variables found in older environment templates; its AI path is local Ollama plus a deterministic caption fallback. No third-party AI API key is currently required or consumed by this implementation.

## Routes

### Web

| Path | Page |
|---|---|
| `/` | Overview |
| `/analytics` | Analytics |
| `/content` | Content list |
| `/content/new` | Composer |
| `/calendar` | Post status/calendar view |
| `/reports` | Reports and CSV export |
| `/ai-insights` | Insights and caption generation |
| `/settings` | Account connections and provider credentials |
| `/login`, `/signup` | Authentication |

### API

All routes are prefixed with `/api`:

| Method and path | Implementation |
|---|---|
| `GET /api/health` | Health response. |
| `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` | Signup, login, logout, session lookup. |
| `GET /api/accounts` | List signed-in user's accounts. |
| `GET /api/accounts/connect/:platform` | Build connection configuration/authorization URL and save OAuth state. |
| `GET /api/accounts/oauth/:platform/callback` | Callback route; live token handling is implemented for YouTube, Reddit, and X only. |
| `GET /api/accounts/provider-credentials`, `POST /api/accounts/provider-credentials`, `DELETE /api/accounts/provider-credentials/:platform` | Read, save, or remove workspace provider credentials. |
| `POST /api/accounts/connect/:platform/mock` | Add a sample account. |
| `DELETE /api/accounts/:accountId` | Disconnect an account. |
| `GET /api/dashboard` | Overview data; accepts `days`, `from`, and `to` query parameters. |
| `GET /api/analytics` | Analytics data; accepts `metric`, `denominator`, `accountIds`, `format`, and `campaign`. |
| `GET /api/posts`, `GET /api/posts/:id`, `POST /api/posts`, `PATCH /api/posts/:id/status`, `POST /api/posts/:id/retry`, `POST /api/posts/:id/publish` | Read and change locally stored post records. Publish is a local status action, not an external platform publish request. |
| `GET /api/reports`, `POST /api/reports`, `DELETE /api/reports/:id`, `GET /api/reports/:id/export.csv` | Report records and CSV download. |
| `GET /api/ai-insights`, `POST /api/ai-insights/caption` | Workspace insights and caption generation. |

## Commands

These package commands are defined by the package manifests and work independently of the PowerShell root runner:

```sh
pnpm --filter @zpf/web dev
pnpm --filter @zpf/api dev
pnpm --filter @zpf/web typecheck
pnpm --filter @zpf/api typecheck
pnpm --filter @zpf/web build
pnpm --filter @zpf/api build
```

The root `dev`, `build`, `start`, `lint`, `typecheck`, test, and database task scripts invoke `scripts/run-turbo.ps1` and therefore require PowerShell. `pnpm docker:dev` and `pnpm docker:down` directly invoke Docker Compose. The Docker services and Drizzle database package are scaffolding; starting them does not switch the API away from JSON-file persistence.

For the optional local Docker services, copy `.env.example` to `.env` and replace the local-only placeholders for PostgreSQL, MinIO, and pgAdmin before running `pnpm docker:dev`. Compose reads the root `.env` for these settings; the service ports are bound to loopback for local development. The database name and account are also configured there. pgAdmin and Redis Insight are in the `tools` profile; start them with `docker compose --profile tools -f infra/docker/docker-compose.dev.yml up -d`. Set `DATABASE_URL` to match the PostgreSQL values only if running the separate Drizzle database commands. Do not reuse local service values outside development.

To use the optional Ollama integration, install Ollama separately, then run:

```sh
ollama pull llama3.2
ollama serve
```

## Storage and production boundary

The API persists current local state to `apps/api/data/local-state.json`. The `.gitignore` excludes this file. PostgreSQL, Redis, and MinIO definitions, plus Drizzle schema/commands, are foundations only and are not wired into the running API's storage or job processing. Scheduled times and approval statuses are stored as post fields; no scheduled publishing worker is implemented.

Before production use, complete and verify live platform publishing and analytics adapters, background scheduling, persistent database storage and migrations, production secret management, CSRF/rate limiting, monitoring, and backup/restore. Platform access and approvals must be verified against each provider.
