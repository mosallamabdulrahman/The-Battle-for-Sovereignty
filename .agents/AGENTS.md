# Project Rules & User Preferences

1. **Supabase Database Updates**:
   - Whenever any database change, migration, or function update is required in Supabase, always provide clear, ready-to-use SQL commands for the user to run in the Supabase SQL Editor.

2. **Development Server (`npm run dev`)**:
   - Always inform the user explicitly if stopping and restarting `npm run dev` is required (for example, when updating `.env.local` files, installing new packages, or when hot-reloading needs a fresh server start).
