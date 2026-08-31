7elhmbenhm Game
7elhmbenhm Game is a competitive, strategic military and trivia quiz game between two teams, built with Next.js and Supabase.

Run Locally
Prerequisites: Node.js installed on your machine.

1. Install Dependencies
   Open your terminal in the project directory and run:

Bash
npm install
Environment variables
Copy .env.example to .env.local for local dev, and to .env on the server
(Docker Compose reads .env only).

Variable Used by
NEXT*PUBLIC_SUPABASE_URL all Supabase clients
NEXT_PUBLIC_SUPABASE_ANON_KEY browser clients
SUPABASE_SERVICE_ROLE_KEY app/api/admin/\* (server-only, never NEXT_PUBLIC*)
SITE_GATE_USERNAME / SITE_GATE_PASSWORD / SITE_GATE_SECRET /gate login
If /admin says a variable is missing, add it to .env on the server and run
./scripts/deploy.sh — editing .env alone does nothing until the container is
recreated.

Deployment
This project is deployed with Docker Compose on the server and keeps its data in Supabase, so application redeploys do not replace the database.

Manual deploy on the server
Bash
git pull --ff-only origin main
./scripts/deploy.sh
GitHub Actions CI/CD
The workflow in .github/workflows/ci-cd.yml builds the app on every pull request and every push to main, then deploys to the production server on pushes to main and manual workflow runs.

Required repository secrets:

HOST

USERNAME

PASSWORD

SUPABASE_SERVICE_ROLE_KEY — optional. If set, every deploy writes it into the
server's .env so the admin panel keeps working without editing the server by
hand. If it is not set, the deploy leaves .env untouched.

The production checkout path is /root/7elhmbenhm-game (the workflow falls back
to the old /root/The-Battle-for-Sovereignty path if the directory was not
renamed yet).
