# CSCI 331 — Pantry & Recipes App

## Overview
This application helps users find doable recipes based on ingredients on-hand, manage a pantry, and favorite recipes. Built as the final project for CSCI 331.

## Features
- Browse recipes aggregated across categories with enriched details (category, area, ingredients)
- Client-side search supports comma-separated tokens across name/category/area/ingredients
- Filters: favorites only, pantry inclusion (select items), category and area dropdowns
- Recipe modal: name, thumbnail, instructions, ingredients+measures, source and YouTube links
- Pantry management: add/remove ingredients
- Guest sessions behave like users during the session (ephemeral), cleared on logout
- Local caching of API results to speed up navigation

## Technology Stack
- Host: Linux or managed container platform
- Framework: SvelteKit (TypeScript)
- Styling: TailwindCSS
- Database: SQLite (`better-sqlite3`)
- Containerization: Docker
- APIs: [TheMealDB](https://themealdb.com)

## Development
```powershell
# Install dependencies
npm install

# Run dev server
npm run dev

# Typecheck & lint
npm run check
npm run lint
```

## Production Build
```powershell
npm run build
```

## Docker
This project includes a multi-stage Dockerfile for adapter-node.

```powershell
# Stop container if one is running
docker stop csci331-final; docker rm csci331-final

# Build the image
docker build -t csci331-final:latest .

# Create local data folder for SQLite persistence
New-Item -ItemType Directory -Force -Path "$PWD\data" | Out-Null

# Run the container (port 3000)
docker run --name csci331-final -p 3000:3000 -v "$PWD\data:/app/data" csci331-final:latest

```

### Environment
- `NODE_ENV=production` (set by Dockerfile)
- `DB_PATH=/app/data/app_prod.db` (set by Dockerfile; override if needed)

## Notes
- Guest pantry/favorites are stored in cookies and cleared on logout.
- API results are cached in `localStorage` with a TTL to reduce load times.
