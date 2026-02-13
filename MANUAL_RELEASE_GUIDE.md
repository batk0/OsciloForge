# Manual Release Trigger Workflow - Usage Guide

## Overview

The OscilloForge project now uses a **manual release workflow** instead of automatic releases on push to main. This provides more control over when and how releases are created.

## Changes Made

1. **Created**: `.github/workflows/release-manual.yml` - New workflow triggered via `workflow_dispatch`
2. **Disabled**: `.github/workflows/release.yml` → renamed to `release.yml.disabled` (prevents automatic triggers)

## Workflow Features

### Release Type Options
- **auto** (default) - Automatically detect release type based on commit messages (semantic-release default)
- **patch** - Create a patch release (e.g., v1.0.0 → v1.0.1)
- **minor** - Create a minor release (e.g., v1.0.0 → v1.1.0)
- **major** - Create a major release (e.g., v1.0.0 → v2.0.0)

### Automatic Checks
The workflow runs the following checks before creating a release:
1. ✅ System dependencies installation (Cairo, Pango, etc.)
2. ✅ Node.js 22 setup with npm cache
3. ✅ Dependency installation
4. ✅ Full test suite (`npm test -- --run`)
5. ✅ Linting check (`npm run lint`)
6. ✅ Release creation via semantic-release

## How to Trigger a Manual Release

### Option 1: GitHub Web UI (Recommended for Most Users)

1. Navigate to your repository: `https://github.com/username/OscilloForge`
2. Click the **Actions** tab
3. In the left sidebar, click **Manual Release**
4. Click the **Run workflow** button (top-right)
5. Select your release type:
   - Leave as **auto** to auto-detect from commits
   - Or choose **patch**, **minor**, or **major**
6. Click **Run workflow**
7. Monitor the workflow execution - it will show progress in real-time

### Option 2: GitHub CLI

```bash
# Auto-detect release type (recommended)
gh workflow run release-manual.yml -f release_type=auto

# Or specify a release type explicitly
gh workflow run release-manual.yml -f release_type=patch
gh workflow run release-manual.yml -f release_type=minor
gh workflow run release-manual.yml -f release_type=major
```

### Option 3: cURL (Advanced)

```bash
curl -X POST \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/USERNAME/OscilloForge/actions/workflows/release-manual.yml/dispatches \
  -d '{"ref":"main","inputs":{"release_type":"auto"}}'
```

Replace `YOUR_GITHUB_TOKEN`, `USERNAME` with your actual values.

## Recommended Workflow

### Before Creating a Release

1. **Ensure main branch is updated**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Verify recent commits follow semantic-release conventions**
   - Format: `feat:`, `fix:`, `docs:`, `refactor:`, `perf:`, `test:`, `chore:`, etc.
   - Breaking changes in commit body trigger major version bump

3. **Review the changelog** (will be auto-generated from commits)

### Creating the Release

1. Go to Actions → Manual Release
2. Click "Run workflow"
3. For auto-detection: **Leave release_type as "auto"**
4. Click "Run workflow"

### After Release Created

The workflow will:
- Run all tests and linting
- Create a new git tag (e.g., `v1.2.3`)
- Generate release notes from commits
- Create a GitHub Release with the changelog
- Update `package.json` version

## Troubleshooting

### Release Fails During Tests
- Review test failures in the workflow logs
- Fix issues locally on a branch
- Merge fixes to main
- Try releasing again

### Release Fails During Linting
- Run `npm run lint:fix` locally
- Commit and push fixes to main
- Try releasing again

### Release Fails During Dependencies Installation
- This is usually temporary - try again
- Check internet connectivity in GitHub Actions
- Review the `npm ci` logs

### Release Doesn't Create a Tag
- Check if there are any changes since the last release
- Verify commits follow semantic versioning (feat:, fix:, etc.)
- If using `auto`, ensure commit messages are conventional

## Important Notes

⚠️ **Key Differences from Auto-Release**
- Releases are **manual only** - no automatic triggers on push
- You have **full control** over when and how often releases happen
- All releases still require passing tests and linting
- `semantic-release` still handles version bumping based on commits

✅ **Best Practices**
- Always use `auto` release type unless you have a specific reason to override
- Ensure all commits to main follow conventional commit format
- Run `npm test` and `npm run lint` locally before pushing to main
- Review workflow logs if a release fails
- Keep releases infrequent and meaningful (not every commit)

## Permissions Required

To trigger the workflow, you need:
- `write` access to the repository (to create releases and tags)
- GitHub Token with `repo` scope (for CLI usage)

## FAQ

**Q: Can I re-run a failed release?**
A: Yes, just trigger the workflow again. The workflow will re-run all checks.

**Q: What if I trigger a release with wrong release type?**
A: The version will be bumped according to your selection. You can manually edit the release or revert the tag/release if needed.

**Q: Will this workflow update the main branch?**
A: Yes - semantic-release will:
- Update `package.json` version
- Create a git tag (e.g., v1.2.3)
- Push back to main automatically

**Q: Can multiple people trigger releases?**
A: Yes, anyone with `write` access to the repo can trigger the workflow.

**Q: Is this different from the old automatic release?**
A: Yes. Previously, every push to main triggered a release. Now you manually trigger it, giving you more control over release frequency.
