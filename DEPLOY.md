# How to Deploy Gamocaro to the Internet for Free

We recommend using **Render** to host your game for free. It supports Node.js applications and static sites easily.

## Prerequisites
1.  A GitHub account.
2.  A Render account (https://render.com).

## Steps

### 1. Push your code to GitHub
If you haven't already, create a new repository on GitHub and push your code there.
```bash
git init
git add .
git commit -m "Initial commit"
# Follow GitHub instructions to add remote and push
```

### 2. Create a Web Service on Render
1.  Log in to your Render dashboard.
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub account and select your `caro_game` repository.
4.  Configure the service:
    *   **Name**: `gamocaro` (or any unique name)
    *   **Region**: Closest to you (e.g., Singapore, Frankfurt, Oregon)
    *   **Branch**: `main` (or `master`)
    *   **Root Directory**: Leave blank (default is root).
    *   **Runtime**: **Node**
    *   **Build Command**: `npm install && npm run build`
        *   *Note: This installs dependencies and builds the React frontend.*
    *   **Start Command**: `npm start`
        *   *Note: This starts the Node.js server which serves both the API and the frontend.*
    *   **Instance Type**: Free

### 3. Deploy
1.  Click **Create Web Service**.
2.  Render will start building your app. This may take a few minutes.
3.  Once the build is complete, you will see a green **Live** badge.
4.  Your game will be available at the URL provided by Render (e.g., `https://gamocaro.onrender.com`).

## Troubleshooting
*   **Port Issues**: The application is configured to listen on `process.env.PORT` automatically, which Render provides.
*   **Socket Connection**: The frontend is configured to automatically connect to the same domain in production, so WebSocket connections should work out of the box.
