---
name: setup-supabase-project
description: Guide the user through creating a real Supabase project and wiring its credentials into a web app's code, when a project currently runs in local-only/placeholder mode and needs real cross-device accounts, shared data, or realtime features. Use when the user wants login/data to work "like a real app" across devices, or wants friends/social features backed by a real database.
---

# Set up a real Supabase project for a local-only web app

Use this when a static web app has Supabase client code already wired up against placeholder credentials (commonly `SUPABASE_URL`/`SUPABASE_ANON_KEY` set to something like `"PEGA_AQUI..."`), and the user wants it to actually work: persistent accounts across devices, shared/social data, etc.

## Why this can't be done for the user automatically

Creating a Supabase project requires the user's own account/identity (email or GitHub OAuth) and accepting terms — there is no API token available in this environment to do it on their behalf. Same constraint as GitHub repo creation.

## Step 1: create the project (the user does this, or Claude for Chrome)

If the user has the Claude for Chrome extension, give them this prompt to paste into it:

> Entra en supabase.com (usa mi sesión si ya estoy conectado, o inicia sesión con GitHub si me lo pide) y crea un nuevo proyecto llamado `<PROJECT_NAME>`. Elige la región más cercana (eu-west, Londres o Frankfurt si aparecen para usuarios en España) y genera una contraseña segura para la base de datos, guárdala en algún sitio visible. Espera a que el proyecto termine de aprovisionarse (1-2 minutos). Cuando esté listo, ve a Project Settings → API y dame la "Project URL" y la clave "anon public" (o "publishable key" si aparece con ese nombre).

Otherwise, tell them to do those same steps manually in the Supabase dashboard.

## Step 2: run the SQL schema

The app's repo should already have (or you should create) a `.sql` file defining the tables the client code expects (profiles, friendships, presence, shared content, etc.) — check the existing Supabase-calling JS (`.from("tablename")` calls) to know exactly which tables/columns are needed before writing or reusing this file. Row-level security should be enabled on every table with explicit policies (never leave RLS off).

Tell the user: open Supabase → SQL Editor → New query, paste the full contents of that `.sql` file, click **Run**.

## Step 3: wire in the credentials

Once the user gives you the Project URL and anon/publishable key (these are safe to paste in chat — they're public client keys, NOT the `service_role` secret key, which must never be requested or pasted anywhere):

1. Find the placeholder constants in the code (grep for the literal placeholder string, e.g. `PEGA_AQUI`) and replace with the real values.
2. Commit and push (see the `deploy-github-pages` skill if this also needs redeploying).
3. Verify by fetching the live page and checking the placeholder string is gone.

## Notes

- Never fabricate or guess a Project URL or key — always wait for the user to supply the real ones.
- If the user reports login/social features "not working," first check `SUPABASE_URL`/`SUPABASE_ANON_KEY` aren't still placeholders — that's the most common cause, and it fails silently into a "local-only" fallback mode rather than throwing a visible error.
- A `unique` constraint check (e.g. `event_local_id` unique across all users) can be too broad if IDs aren't scoped per-owner — double check schema design against how client-generated IDs are actually produced (e.g. `Date.now()+random` vs a real per-owner sequence) before assuming uniqueness holds.
