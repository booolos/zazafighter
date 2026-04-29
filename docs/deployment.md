# Deployment

This project is a Vite app intended to be published as a static site.

## GitHub Pages

1. Create a GitHub repository.
2. From this folder, initialize git and make the first commit.
3. Push the branch to GitHub.
4. In the repository settings, enable Pages with GitHub Actions as the source.
5. Push to `main` to run `.github/workflows/deploy.yml`, which builds the app and publishes `dist/`.

The current Vite config uses `base: './'`, which keeps generated script and CSS URLs relative. That works for GitHub Pages project sites without needing to know the final repository name.

## Pre-Publish Checks

Run these before pushing:

```sh
npm ci
npm run build
npm run validate:assets
```

## Commit Scope

Commit source, docs, package files, and runtime assets under `public/`. Do not commit `node_modules/`, `dist/`, `.DS_Store`, local `.env*` files, or `tmp/`.

## Notes

The production build rewrites CSS asset references into relative paths under `dist/`, so the current output is suitable for GitHub Pages project sites.
