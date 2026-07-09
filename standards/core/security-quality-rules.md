---
title: Security & Quality Rules
platform: all
load_when: "Writing or reviewing any code — secrets, transport/CORS, ReDoS, container hardening, code hygiene, code smells, and the quality-gate governance loop."
updated: 2026-07
---

# Security & Quality Rules

Cross-cutting rules that catch the defects a static-analysis quality gate (e.g. SonarQube) flags most often. These are floors, not aspirations — an AI agent or human MUST satisfy them before proposing a change as done.

## Secrets & credentials

- **MUST NOT** hardcode passwords, API keys, connection strings with credentials, encryption keys, tokens, or certificates — not in source, comments, examples, or tests.
- **MUST** keep only **non-sensitive** values in committed config (`appsettings.json`, `.env.example`): ports, public hostnames, feature flags, log levels. A sensitive value that needs a visible default is an empty string or an obvious placeholder (`"__SET_IN_ENV__"`) — **never** a real or believable example value.
- **MUST** inject secrets at runtime — environment variables, a local user-secrets mechanism, or a secret manager (Azure Key Vault / AWS Secrets Manager / GCP Secret Manager).
- **MUST**, on finding a hardcoded secret, treat it as **compromised**: surface it to a human to rotate it, don't just move it. Once in git history, assume it leaked.

```jsonc
// appsettings.json — placeholders only; real values injected at runtime
{ "DATABASE_URL": "", "ENCRYPTION_KEY": "", "API_PORT": 3005 }
```

## Transport security & CORS

- **MUST** use HTTPS for every origin except `localhost` / `127.0.0.1` in development.
- **MUST NOT** use `AllowAnyOrigin()` in production — list explicit origins, read from configuration.
- **MUST NOT** combine `AllowAnyOrigin()` with `AllowCredentials()` (invalid and dangerous). `AllowAnyHeader()` / `AllowAnyMethod()` are acceptable only when the origin set is restricted.

## Regex — always bound execution (ReDoS)

- **MUST** give every regular expression a match timeout so a crafted input can't hang the process (Regular-expression Denial of Service).
- **SHOULD** keep the timeout between `100ms` (fast validations) and `2s` (complex parsing); never infinite.

```csharp
// ❌ WRONG — no timeout, vulnerable to ReDoS
private static readonly Regex Id = new(@"^[A-Za-z0-9_]{1,40}$", RegexOptions.Compiled);

// ✅ CORRECT — explicit timeout
private static readonly Regex Id = new(@"^[A-Za-z0-9_]{1,40}$", RegexOptions.Compiled, TimeSpan.FromSeconds(2));
```

> In JavaScript/TypeScript there is no per-regex timeout: bound the input length before matching and avoid nested quantifiers that backtrack catastrophically (`(a+)+`).

## Container hardening

- **MUST NOT** run the container as root — create and switch to a non-privileged user.
- **MUST** pin base-image tags (never `:latest`), use a multi-stage build so the SDK never ships in the final image, keep a current `.dockerignore` (exclude `bin/`, `obj/`, `.git/`, dev config, secrets), and define a `HEALTHCHECK`.

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:10.0
RUN groupadd -r app && useradd -r -g app -u 1001 app
WORKDIR /app
COPY --from=build --chown=app:app /app/publish .
USER app
ENTRYPOINT ["dotnet", "MyApp.Api.dll"]
```

<!-- when:backend -->
## .NET / C# code hygiene

- **MUST** catch **specific** exceptions (not bare `Exception`, except in a global handler), log with structured logging (`LogError(ex, "…{Param}", value)` — never string-concatenate), and never swallow silently.
- **MUST** use exceptions only for unexpected/infrastructure errors — expected business flows use the Result pattern (see [`../backend/backend-standards.md`](../backend/backend-standards.md)).
- **MUST** use `async`/`await` for all I/O, never mix `.Result` / `.Wait()` (deadlocks), add `ConfigureAwait(false)` in reusable libraries (not in ASP.NET Core endpoints), and propagate `CancellationToken` from endpoint to repository.
- **MUST** enable `<Nullable>enable</Nullable>` and honor the annotations; dispose everything `IDisposable` / `IAsyncDisposable` via `using` / `await using`; make classes `sealed` by default.
<!-- /when -->

## Code smells (refactor before shipping)

- **MUST NOT** leave a method over ~50 lines or cyclomatic complexity over ~10 — extract.
- **MUST NOT** use magic numbers/strings — name them as constants or enums.
- **MUST NOT** leave a `TODO`/`FIXME` without an issue reference (`TODO(#123): …`).
- **MUST** delete dead code rather than comment it out — version control is the history.
- **SHOULD** run a dependency vulnerability audit (`dotnet list package --vulnerable`, `npm audit`) and resolve high-severity advisories before release.

> Test coverage thresholds and test design live in [`testing-strategy.md`](testing-strategy.md).

## Quality-gate governance (keep the rules alive)

When the quality gate flags a pattern **not** covered here, don't just fix the finding — **add the rule to this document** (with a ❌/✅ example if it's a new category), in the same change. That way the next AI- or human-authored code never repeats the pattern.
