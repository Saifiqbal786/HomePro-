# Deploying HomePro to Vercel

Vercel is a fantastic platform for frontend and serverless applications. However, because HomePro uses **Socket.io** for real-time chat and an Express backend, deploying to Vercel requires configuring it to run as a serverless function, and adding specific environment variables. 

Here is the step-by-step procedure to deploy your project on Vercel.

---

## Step 1: Add a `vercel.json` File
Vercel needs to know how to route your traffic. It needs to send API requests to your Node.js backend, and everything else to your static frontend files.

Create a file named `vercel.json` in the **root** of your repository (the same folder as `package.json`) and paste this exact code:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    },
    {
      "src": "frontend/**/*",
      "use": "@vercel/static"
    }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/backend/server.js"
    },
    {
      "source": "/(.*)",
      "destination": "/frontend/$1"
    }
  ]
}
```

## Step 2: Push to GitHub
Commit and push your `vercel.json` file to your GitHub repository.

```bash
git add vercel.json
git commit -m "chore: add vercel configuration for deployment"
git push
```

---

## Step 3: Deploy on Vercel
1. Go to [Vercel.com](https://vercel.com/) and log in with your GitHub account.
2. Click **"Add New" -> "Project"**.
3. Import your `worker-homeowner` repository from GitHub.
4. **DON'T CLICK DEPLOY YET.** You need to configure your Environment Variables first!

---

## Step 4: Add Environment Variables
In the Vercel deployment screen, open the **Environment Variables** tab. You MUST add all of these variables, exactly as they are named in your backend code:

| Variable Name | Value (Example) | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://user:pass@ep-rest-123.supabase.co:5432/postgres` | Your live PostgreSQL database URL (from Supabase, Neon, etc.) |
| `JWT_SECRET` | `your_super_secret_production_key_here` | A random string of text used to sign user logins safely. |
| `JWT_EXPIRES_IN` | `7d` | How long a user stays logged in before it expires. |
| `EMAIL_USER` | `your-email@gmail.com` | The email address you use to send OTPs for password resets. |
| `EMAIL_PASS` | `abcd1234efgh5678` | The App Password generated for your email. |

*(Note: Ensure you are using a Cloud PostgreSQL database because local `.db` files do not persist on Vercel.)*

Once you have added all those variables, click **Deploy**.

---

## ⚠️ Important Vercel Limitations

Vercel uses **Serverless Functions** to host Node.js. This means the server turns on and off instantly for every single request. 
1. **WebSockets (Socket.io) Warning:** Because Vercel kills the server after every request, real-time constant connections like WebSockets cannot stay open. Your application's chat might fall back to "HTTP Long-Polling" which is slower, or it might disconnect.
2. **Alternative Host:** If your chat completely breaks on Vercel, the industry standard for hosting apps with Socket.io is **[Render.com](https://render.com/)**, **[Railway.app](https://railway.app/)** or **[Fly.io](https://fly.io/)**. They run your `npm start` continuously in the background instead of turning it off, solving the WebSocket problem completely!
