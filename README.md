# Flowerful Creative Studio

Vercel-ready Next.js source package.

## Deploy to Vercel

1. Upload this folder to a GitHub repository.
2. In Vercel, choose **Add New → Project** and import that repository.
3. Keep **Framework Preset: Next.js** and leave the build settings on their defaults.
4. Add `OPENAI_API_KEY` under **Settings → Environment Variables** if you want in-app background generation.
5. Deploy.

## Local development

```bash
npm install
npm run dev
```

The project intentionally uses npm and `package-lock.json` for reliable Vercel installs.
