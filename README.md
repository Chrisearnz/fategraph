# FateGraph

A premium, mobile-first React app. "See the 5 lives you could have lived."

---

## 🚀 Deployment guide (for non-developers)

You have two equally good options: **Vercel** and **Netlify**. Both are free, both work in the browser (no terminal needed), and both give you a live URL in ~2 minutes. Pick one. Vercel is slightly more polished for React; Netlify is slightly simpler.

Before either path, you need to get this folder onto GitHub. That's the one prerequisite.

---

### Step 0 — Put the code on GitHub (one-time, ~5 minutes)

1. Go to **https://github.com** and sign up (free) if you don't already have an account.
2. Click the green **New** button (or visit **https://github.com/new**) to create a new repository.
   - Repository name: `fategraph`
   - Visibility: **Public** (free hosting requires this on most free plans; Private works too if you upgrade).
   - Do **NOT** check "Add a README" or any other initialization box.
   - Click **Create repository**.
3. On the next page, click **uploading an existing file** (it's a small link in the middle of the page, under "Quick setup").
4. Drag the **entire contents of the `fategraph` folder** into the upload area:
   - `index.html`
   - `package.json`
   - `vite.config.js`
   - `tailwind.config.js`
   - `postcss.config.js`
   - `.gitignore`
   - `README.md`
   - the whole `src/` folder
   - (do NOT upload `node_modules` if it exists — the `.gitignore` will prevent this anyway)
5. Scroll down, click the big green **Commit changes** button.

Your code is now on GitHub. ✅

---

### Option A — Deploy with Vercel (recommended)

1. Go to **https://vercel.com** and click **Sign Up**.
2. Choose **Continue with GitHub** and authorize Vercel.
3. On the dashboard, click **Add New... → Project**.
4. Find your `fategraph` repository in the list and click **Import**.
5. On the configuration screen, **leave every setting as-is**. Vercel auto-detects Vite. Just click **Deploy**.
6. Wait ~60 seconds. When you see the confetti animation, your app is live.
7. Click the preview thumbnail or the `.vercel.app` URL to open it.

**Your live URL will look like:** `https://fategraph-xxx.vercel.app`

To use a custom domain later: in the project dashboard, go to **Settings → Domains** and add your domain.

---

### Option B — Deploy with Netlify

1. Go to **https://netlify.com** and click **Sign Up**.
2. Choose **GitHub** and authorize Netlify.
3. On the dashboard, click **Add new site → Import an existing project**.
4. Pick **GitHub**, then select your `fategraph` repository.
5. On the configuration screen, confirm:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - (Netlify auto-fills both correctly for Vite. If not, type them.)
6. Click **Deploy site**.
7. Wait ~90 seconds. Netlify gives you a URL like `https://casual-name-12345.netlify.app`.

To rename the URL: in the site dashboard, go to **Site settings → Change site name**.

---

## 🔄 How to update the app later

Every time you push changes to GitHub, Vercel/Netlify automatically rebuilds and redeploys. You don't do anything.

To edit in the browser:
1. Open your repository on GitHub.
2. Click any file (e.g. `src/FateGraph.jsx`), then the pencil icon ✏️ to edit.
3. Save ("Commit changes"). Your live site updates in ~60 seconds.

---

## 🛠️ Admin preview (no redeploy needed)

To see all 5 paid lives without going through the paywall, add `?admin=1` to your URL:

```
https://your-site.vercel.app/?admin=1
```

A small floating pill appears bottom-right to toggle admin mode. Regular users who don't know this URL trick will never see the button.

---

## 📬 Formspree email capture

Emails submitted by users go to the Formspree form:
**https://formspree.io/f/xzdyvpdb**

If emails aren't arriving:
1. Check the inbox (including **spam folder**) of the email address you used to register the Formspree form — Formspree's very first submission triggers a confirmation email you must click to activate the form.
2. Log in at **https://formspree.io** and check the **Submissions** tab.
3. Free plan limit: 50 submissions/month.

---

## 🧪 Run locally (only if you want to)

You do NOT need to do this to deploy. It's only for editing on your own computer. Requires Node.js installed.

```bash
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 📦 What's in this folder

- `index.html` — page entry point
- `src/main.jsx` — React mount point
- `src/FateGraph.jsx` — the entire app (UI, logic, personalization engine)
- `src/index.css` — Tailwind setup
- `tailwind.config.js`, `postcss.config.js` — styling config
- `vite.config.js` — build tool config
- `package.json` — dependency list
