# 🌊 Ireland Tides

A real-time fishing tide dashboard for Ireland, featuring tide tables, weather forecasts, and community catch reporting.

## 🚀 How to Deploy (Phase 1)

This application is a **static web app**, meaning it can be hosted for free on platforms like Netlify or Vercel without a complex backend server.

### Option A: Drag & Drop (Easiest)
1.  **Locate the Folder**: Find the `ireland-tides` folder on your computer.
    -   Path: `c:\Users\killi\Desktop\Antigravity\IrelandTides\ireland-tides`
2.  **Go to Netlify**: Open [Netlify Drop](https://app.netlify.com/drop).
3.  **Upload**: Drag the `ireland-tides` folder directly onto the page.
4.  **Done**: Netlify will give you a public URL (e.g., `https://random-name-123.netlify.app`).

### Option B: Automatic Updates (GitHub)
1.  Create a new repository on [GitHub](https://github.com/new).
2.  Push this code to the repository.
3.  Log in to [Netlify](https://app.netlify.com/).
4.  Click "Add new site" -> "Import from existing project".
5.  Select GitHub and choose your repository.
6.  **Done**: Now, every time you save code changes to GitHub, your site updates automatically.

## ⚠️ Important Note on Data
Currently, this version uses **Local Storage**.
-   User accounts and posts are saved in the **browser**.
-   If you clear your cache or switch devices, your data will not carry over.
-   **Phase 2** of development will involve connecting a real database (Firebase) to solve this.

## 💻 Running Locally
To test the app on your own computer:
1.  Open Chrome/Edge.
2.  Open the file: `index.html`.
3.  OR run a local server: `python -m http.server 8000` and visit `http://localhost:8000`.
