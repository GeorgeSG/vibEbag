---
description: Release a new version — bump, publish Docker image, and create GitHub release.
argument-hint: "[patch|minor|major]"
allowed-tools: Bash(npm run version:*), Bash(npm run docker:publish), Bash(git *), Bash(gh *)
---

Release a new version. The argument is the bump type: patch, minor, or major.

## Steps

1. **Validate input**: The argument must be one of `patch`, `minor`, or `major`. If missing or invalid, ask the user.

2. **Generate release notes**: Run `git log --oneline $(git describe --tags --abbrev=0)..HEAD --no-merges` to get all commits since the last tag. Group them by prefix into Features (`feat:`), Fixes (`fix:`), and Other (`chore:`, `docs:`, `refactor:`, etc). Write concise human-readable bullet points — don't just copy commit messages verbatim.

3. **Show the release notes draft** to the user and ask for confirmation before proceeding.

4. **Bump version**: Run `npm run version:$type` where `$type` is the argument. This bumps `package.json`, creates a git tag, and pushes with tags.

5. **Publish Docker image**: Run `npm run docker:publish`. This builds multi-arch images and pushes to `ghcr.io/georgesg/vibebag`.

6. **Create GitHub release**: Use `gh api repos/GeorgeSG/vibebag/releases` to create a release with the new tag name (e.g. `v0.1.0`) and the generated release notes as the body.

7. **Report**: Show the GitHub release URL when done.

## Argument

$ARGUMENTS
