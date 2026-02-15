# Setup Instructions for New Collaborators

## Prerequisites
- Git installed on your computer
- Node.js and npm installed (download from [nodejs.org](https://nodejs.org/))
- Cursor IDE installed

## Step 1: Clone the Repository

1. Open Cursor IDE
2. Open the terminal in Cursor (Terminal → New Terminal, or press `` Ctrl+` `` / `` Cmd+` ``)
3. Navigate to where you want to store the project:
   ```bash
   cd ~/Desktop
   ```
   (or wherever you prefer to keep your projects)

4. Clone the repository:
   ```bash
   git clone git@github.com:iamtristanburke/iamtristanburke.github.io.git
   ```

5. Navigate into the project folder:
   ```bash
   cd iamtristanburke.github.io
   ```

## Step 2: Create a New Branch

Always work on your own branch, never directly on `main`:

```bash
git checkout -b your-name/feature-description
```

Example:
```bash
git checkout -b john/update-dashboard
```

## Step 3: Install Dependencies

The project has two parts that need setup:

### Dashboard (Frontend)
1. Navigate to the dashboard folder:
   ```bash
   cd dashboard
   ```

2. Install npm packages:
   ```bash
   npm install
   ```

   This will install all the required libraries (React, TypeScript, Vite, etc.)

### Pipeline (Python - Optional)
If you need to work with the Python pipeline:
```bash
cd ../pipeline
pip install -r requirements.txt
```

## Step 4: Open the Project in Cursor

1. In Cursor, go to **File → Open Folder**
2. Navigate to and select the `iamtristanburke.github.io` folder
3. Click "Open"

## Step 5: Run the Development Server

To see the dashboard locally:

1. Make sure you're in the `dashboard` folder:
   ```bash
   cd dashboard
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and go to the URL shown in the terminal (usually `http://localhost:5173`)

## Quick Reference

- **Start dev server**: `npm run dev` (from `dashboard` folder)
- **Build for production**: `npm run build` (from `dashboard` folder)
- **Check git status**: `git status`
- **See your branch**: `git branch`

## Need Help?

If you run into issues:
- Make sure Node.js is installed: `node --version` and `npm --version`
- Make sure you're in the correct folder when running commands
- Check that you've accepted the GitHub collaboration invitation

