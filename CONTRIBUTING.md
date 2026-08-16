# Contributing to AIFlowHub

Thanks for your interest in contributing. AIFlowHub is a **community continuation** of [Flowise](https://github.com/FlowiseAI/Flowise). Independent maintenance started in **January 2026**, months before the upstream Code Freeze (Jul 29, 2026) and Archive (Aug 13, 2026). See the official [EOL announcement](https://github.com/FlowiseAI/Flowise/discussions/6727).

We welcome PRs that would previously have gone to FlowiseAI/Flowise — this fork was already under active stewardship before the community went read-only.

English | [中文](./i18n/CONTRIBUTING-ZH.md)

## Ways to contribute

-   Report bugs via [GitHub Issues](https://github.com/ktz03/AIFlowHub/issues)
-   Propose features / ideas in Issues (label suggestions welcome)
-   Improve docs (`README.md`, `docs/`, `DEPLOYMENT.md`)
-   Add or fix components under `packages/components`
-   Improve server services under `packages/server` (workflow-generator, governance, auth, etc.)
-   Improve UI under `packages/ui`

### Good first contributions

-   New **Chat Model** nodes (especially OpenAI-compatible providers)
-   New **Tool** nodes with clear docs and credentials
-   Bug fixes with reproduction steps
-   i18n / README improvements
-   Docker / Offline LLM deploy fixes

## Development setup

Prerequisite: Node.js 18+ / 20+ (see `package.json` engines if present), PNPM 8+.

```bash
git clone https://github.com/ktz03/AIFlowHub.git
cd AIFlowHub
pnpm install
pnpm build
pnpm dev
```

-   Dev UI: `http://localhost:8080`
-   Production start: `pnpm start` → `http://localhost:3000`

Monorepo packages:

-   `packages/server` — API & business services
-   `packages/ui` — React frontend
-   `packages/components` — LangChain nodes / credentials
-   `packages/api-documentation` — OpenAPI docs

## Pull request process

1. Fork `ktz03/AIFlowHub` and create a branch:
    - Feature: `feature/<short-name>`
    - Bugfix: `bugfix/<short-name>`
2. Keep the change focused (one feature / fix per PR when possible).
3. Follow existing code style (ESLint / Prettier; hooks run on commit).
4. Update docs if you add user-facing behavior.
5. Open a PR against `develop` with:
    - What changed and why
    - How to test
    - Screenshots for UI changes

### PR checklist

-   [ ] Builds locally (`pnpm build`)
-   [ ] No secrets committed (`.env`, API keys, sqlite dumps, docker image tarballs)
-   [ ] New nodes include credential + icon when needed
-   [ ] Descriptions / labels preferably in English for node UI (match Flowise conventions)

## Coding guidelines

-   Prefer small, reviewable diffs
-   For Chat Models: follow existing OpenAI-compatible wrappers (credential + `ChatOpenAI`/`baseURL` pattern when applicable)
-   For Skill / workflow-generator changes: keep Intent Routing explainable; update `skills/workflow-patterns.json` when adding categories
-   Do not include AIFlowHub-only branding changes in generic node PRs unless intentional

## Security

Please do not open public issues for sensitive vulnerabilities. See [`SECURITY.md`](./SECURITY.md).

## License

By contributing, you agree that your contributions are licensed under the same terms as this repository (see [`LICENSE.md`](./LICENSE.md), based on Apache-2.0 Flowise heritage).

## Maintainer

-   Repo: https://github.com/ktz03/AIFlowHub
-   Default branch: `develop`
