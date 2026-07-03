# Year 12 Revision Interactives

A static Vite site that hosts the revision interactives in this folder:

- Two-step Equations
- Equation Minute Level Two
- Linear Equations
- Trig Ratios

## Local development

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
pnpm preview
```

## GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds the app and publishes `dist` to GitHub Pages whenever changes are pushed to `main` or `master`.

In the GitHub repository, set **Settings > Pages > Build and deployment > Source** to **GitHub Actions**.
