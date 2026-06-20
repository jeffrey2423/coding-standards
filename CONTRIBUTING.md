# Contributing

Thanks for your interest in improving this coding-standards library! Contributions of all kinds are welcome — new standards, corrections, clearer examples, and installer improvements.

## Project layout

```
bin/cli.js          # interactive installer (Node, zero runtime deps beyond @clack/prompts)
standards/          # the standards library, organized into selectable packs
├── core/           #   always installed (architecture, conventions, testing, AI collaboration)
├── backend/        #   .NET track (+ opt-in distributed-architecture docs)
├── web/            #   spa | single-spa | microfrontends tracks + shared _base
└── mobile/         #   flutter | react-native
```

## Local setup

```bash
git clone https://github.com/jeffrey2423/coding-standards.git
cd coding-standards
npm install
```

Try the installer against a scratch folder:

```bash
mkdir /tmp/try && cd /tmp/try
node /path/to/coding-standards/bin/cli.js --all
node /path/to/coding-standards/bin/cli.js --help
```

## Adding or editing a standard

1. Put the file in the right pack (`core/`, `backend/`, `web/<track>/`, `mobile/<fw>/`).
2. **Add YAML front-matter** to the top of every standard:

   ```yaml
   ---
   title: My Standard
   platform: backend        # all | backend | web | mobile
   track: distributed-architecture   # optional
   load_when: "One-line trigger an AI agent uses to decide when to load this."
   updated: 2026-06
   ---
   ```

3. Write rules as **imperative MUST / SHOULD bullets** (RFC 2119), with at least one **DO / DON'T** example for non-trivial rules. See [`standards/core/ai-collaboration.md`](standards/core/ai-collaboration.md).
4. **Open-source only:** any library you recommend MUST use a permissive OSS license (MIT, Apache-2.0, BSD, ISC, PostgreSQL). No commercial / revenue-gated / AGPL dependencies. See `standards/backend/technology-stack.md`.
5. If you add a new pack/track, wire it into `bin/cli.js` (the `resolveSources` map and the prompts).
6. Keep facts current and **verifiable** — prefer linking official docs over asserting versions.

## Pull requests

- Branch from `main`, keep the change focused.
- Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`…).
- Describe what changed and why; reference any issue.
- Don't bump the package version in your PR — releases are handled by the maintainer.

## Releases

Merging to `main` runs the publish workflow, which publishes to npm **only when `package.json`'s version changes**. Documentation/meta changes ship without a version bump.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating you agree to uphold it.
