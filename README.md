# The Battle for Sovereignty (معركة سيادة)

The Battle for Sovereignty is a competitive, strategic military and trivia quiz game between two teams, built with Next.js and Supabase.

---

## Run Locally

**Prerequisites:** Node.js installed on your machine.

### 1. Install Dependencies

Open your terminal in the project directory and run:

```bash
npm install
```

## Deployment

This project is deployed with Docker Compose on the server and keeps its data in Supabase, so application redeploys do not replace the database.

### Manual deploy on the server

```bash
git pull --ff-only origin main
./scripts/deploy.sh
```

### GitHub Actions CI/CD

The workflow in `.github/workflows/ci-cd.yml` builds the app on every pull request and every push to `main`, then deploys to the production server on pushes to `main` and manual workflow runs.

Required repository secrets:

- `HOST`
- `USERNAME`
- `PASSWORD`

The production checkout path is `/root/The-Battle-for-Sovereignty`. Update the workflow if the repository lives somewhere else on the server.
