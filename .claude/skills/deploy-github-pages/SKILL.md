---
name: deploy-github-pages
description: Publish a local static site (a folder with index.html) to a public URL via a new or existing GitHub repo + GitHub Pages. Use when the user asks to "publish", "deploy", "put online", "give me a link", or "share" a local web project, or to push updates to one already deployed this way.
---

# Deploy a local site to GitHub Pages

Use this whenever the user wants a local static HTML project turned into a public link, or wants to push new changes to a project already deployed this way.

## Environment checks (do first, once per machine)

1. Check `git` is on PATH (`git --version`). If missing, install it:
   `winget install --id Git.Git -e --source winget --accept-source-agreements --accept-package-agreements`
   Then add `C:\Program Files\Git\cmd` to `$env:PATH` for the current shell session before any git command.
2. Check if the target folder is already a git repo (`Test-Path .git`) and if it already has a remote (`git remote -v`). Skip init/remote-add steps that already exist.

## Getting an empty GitHub repo

You cannot create a GitHub repo yourself (no credentials/API token here) and `git push` cannot create a repo that doesn't exist. Two paths, offer both:

- **If the user has the Claude for Chrome extension**: give them this exact prompt to paste into it (fill in the repo name):
  > Entra en github.com (ya tengo sesión iniciada) y crea un nuevo repositorio **vacío** llamado `<REPO_NAME>` en mi cuenta (sin README, sin .gitignore, sin licencia). Que sea **público**. Dime la URL completa del repositorio cuando esté creado.
- **Otherwise**: ask them to go to github.com/new themselves and paste you the resulting URL.

Wait for the user to give you the repo URL before proceeding — never guess a username or repo name.

## Pushing the code

```powershell
$env:PATH += ";C:\Program Files\Git\cmd"
cd <PROJECT_FOLDER>
git init                                    # skip if already a repo
git config user.email "<user's email if known, else ask>"
git config user.name "<user's name if known, else ask>"
git add -A
git commit -m "<descriptive message>"
git branch -M main
git remote add origin <REPO_URL>.git        # skip if remote already set; use a distinct remote name (e.g. repo2) if pushing the same working tree to a second repo without disturbing origin
git push -u origin main 2>&1
```

Notes learned from experience:
- `git push` output routed through PowerShell often shows as a red `NativeCommandError` even on success — check for `main -> main` or `[new branch]` in the output before concluding it failed.
- The **first** push in a fresh environment may fail with `terminal prompts disabled` / `could not read Username` — this sandboxed shell can't do the interactive Git Credential Manager login. Tell the user to run the exact `git push` command themselves in their own regular terminal (not this one) once; GCM will pop a browser login. After that one-time login, GCM caches the credential and subsequent pushes from this sandboxed shell work fine.
- If the user wants the same code in a **second, separate repo** (a rename/fork/new-account scenario), add it as an additional git remote (e.g. `repo2`) rather than changing `origin`, so both stay pushable independently. Don't carry repo-specific content (like a canonical URL meta tag pointing at the old repo) into the new one without updating it first.

## Enabling GitHub Pages

You cannot enable this via API without a token. Give the user these exact steps (fill in their repo URL):

1. Ve a `https://github.com/<user>/<repo>/settings/pages`
2. En "Build and deployment" → "Source", elige **Deploy from a branch**
3. Rama **main**, carpeta **/ (root)** → **Save**

The resulting URL is `https://<user>.github.io/<repo>/` (case-sensitive repo name). Propagation takes 1-2 minutes.

## Verifying

Don't just claim success — check:
```powershell
Invoke-WebRequest -Uri "https://<user>.github.io/<repo>/" -UseBasicParsing -TimeoutSec 15
```
200 means it's live. For a redeploy, also grep the fetched content for a string unique to the new change to confirm it's not a stale cached build.
