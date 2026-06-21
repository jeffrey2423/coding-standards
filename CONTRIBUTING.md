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
7. **Cross-references must survive partial installs.** A user installs only a subset of standards, and the installer prunes every line that links to a standard they didn't select. So:
   - Put each cross-doc link on its **own self-contained line** — a list item or a single table row. When that line is pruned, nothing else should break.
   - **Never use relative references** like "see the table above", "both docs above", or "the standard below" — they orphan as soon as the thing they point to is pruned. Name the target with its own link instead.
   - A row that depends on **multiple** other standards should link to **all** of them, so it prunes when any is absent (e.g. a "Combined" option linking to both tracks it combines).
   - Decision/comparison tables prune to the user's selection; keep each row independent of its siblings.
8. **Commit content to the install-time decision** so AI agents don't diverge. The installer is decision-aware: option-specific content for a path the user did **not** select is removed. Wrap such content in conditional markers (HTML comments — invisible when rendered):
   - **Block** (multi-line: paragraphs, blockquotes, sections): `<!-- when:arch=monolith -->` … `<!-- /when -->`.
   - **Inline** (a single line or table row): put the marker at the end of the line, e.g. `| **SPA** | … |<!-- when:web=spa -->`. Multiple inline markers on one line are ANDed.
   - **Conditions:** `dim=val[,val]` (OR) or `dim!=val`. Dims: `arch` (doc id), `web` (`spa`/`single-spa`/`mf`), `backend`, `mobile`. A row that links to another standard is also pruned automatically when that standard isn't installed — so reserve markers for content **without** such a link (decision trees, no-link comparison rows, "consider the simpler option" guidance).
   - Never leave content that recommends a path the user didn't choose (e.g. "start with a monolith" in a microservices-only install).

## Pull requests

- Branch from `main`, keep the change focused.
- Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`…).
- Describe what changed and why; reference any issue.
- Don't bump the package version in your PR — releases are handled by the maintainer.

## Releases

Merging to `main` runs the publish workflow, which publishes to npm **only when `package.json`'s version changes**. Documentation/meta changes ship without a version bump.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating you agree to uphold it.
