---
description: Run lint/format/build checks, fix issues, split changes into semantic commits, and push.
allowed-tools: Bash(npx eslint *), Bash(npx prettier *), Bash(npx vite build), Bash(npm run seed), Bash(git *), Bash(node -c *), Bash(timeout *)
---

Run all checks, commit changes in meaningful semantic groups, and push.

## Phase 1: Determine if any code has changed

1. Run `git diff` and `git status` to see all changes.
2. If any code has changed, proceed to Phase 2.
3. If only non-code files (e.g. README, docs) have changed, skip checks and go directly to Phase 3.

## Phase 2: Code Checks

Run each step independently — do NOT run them in parallel. A failing step must not prevent the remaining steps from running.

1. **ESLint (dashboard)**: Run `cd dashboard && npx eslint .`. Record output.
2. **ESLint (server)**: Run `cd server && npx eslint .`. Record output.
3. **Prettier**: Run `cd dashboard && npx prettier --check 'src/**/*.{js,jsx,css}' vite.config.js eslint.config.js '../server/**/*.js'`. If files are unformatted, fix them with `--write`.
4. **Build (dashboard)**: Run `cd dashboard && npx vite build` to verify the production build succeeds.
5. **Build (server)**: Run `node -c server/index.js` to verify the server has no syntax errors, then start it briefly with `timeout 3 node server/index.js` to confirm it boots without crashing.
5. **Report**: Summarize results as a checklist with pass/fail for each step. If any checks failed and could not be auto-fixed, stop and offer to fix them. Otherwise, proceed to Phase 2.

## Phase 3: Commit and push

1. Run `git diff` and `git status` to see all changes.
2. Analyze the full diff and group changes into meaningful semantic commits.
3. Create each commit separately by staging the relevant files for each group. Use `git add <specific files>` — never `git add -A` or `git add .`.
4. Show a summary of all commits to be created and ask for confirmation before creating them. If changes are requested, modify the commits accordingly and repeat until confirmed.
5. After all commits are created, run `git push`.
6. Show a summary of all commits pushed.
