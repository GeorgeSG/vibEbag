---
description: Run all checks (lint, format, build, seed) before pushing to ensure the codebase is clean.
allowed-tools: Bash(npx eslint *), Bash(npx prettier *), Bash(npx vite build), Bash(npm run seed), Bash(git diff *)
---

Run all checks before pushing to ensure the codebase is in a clean state.

## Important

Run each step independently — do NOT run them in parallel. A failing step must not prevent the remaining steps from running. Collect all results and report at the end.

## Steps

1. **ESLint (dashboard)**: Run `cd dashboard && npx eslint .`. Record output.

2. **ESLint (server)**: Run `cd server && npx eslint .`. Record output.

3. **Prettier**: Run `cd dashboard && npx prettier --check 'src/**/*.{js,jsx,css}' vite.config.js eslint.config.js '../server/**/*.js'`. Record any unformatted files.

4. **Build**: Run `cd dashboard && npx vite build` to verify the production build succeeds.

5. **Seed data**: If `server/seed.js`, `server/queries.js`, or `dashboard/src/data/processOrders.js` were changed since the last push (check with `git diff @{push}.. --name-only`), run `npm run seed` and verify it exits cleanly. If no relevant files changed, skip this step.

6. **Report**: Summarize results as a checklist with pass/fail for each step. If all checks pass, tell the user it's safe to push. If any failed, list the failures and offer to fix them.
