# Quick Deployment Guide

## Deploy to GitHub Pages in 5 Minutes

### Step 1: Create GitHub Repository
1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Name it `power-monitor` (or any name you prefer)
5. Make it **Public** (required for free GitHub Pages)
6. Click "Create repository"

### Step 2: Upload Files
1. In your new repository, click "uploading an existing file"
2. Drag and drop these files into the upload area:
   - `index.html`
   - `styles.css`
   - `script.js`
   - `README.md`
   - `test-data.html` (optional, for testing)
3. Click "Commit changes"

### Step 3: Enable GitHub Pages
1. Go to your repository **Settings**
2. Scroll down to "Pages" in the left sidebar
3. Under "Source", select "Deploy from a branch"
4. Choose "main" branch and "/ (root)" folder
5. Click "Save"

### Step 4: Access Your Site
- Your site will be available at: `https://yourusername.github.io/power-monitor`
- It may take a few minutes to become available

## Alternative: Using GitHub CLI

```bash
# Clone this repository
git clone <this-repo-url>
cd power-monitor

# Create new GitHub repository
gh repo create power-monitor --public

# Push files
git add .
git commit -m "Initial commit"
git push -u origin main

# Enable GitHub Pages
gh repo edit --enable-pages
```

## Testing Your Deployment

1. **Open your deployed site** in Chrome or Edge
2. **Test without hardware** using the test data generator:
   - Open `test-data.html` in another tab
   - Start generating test data
   - In the main app, click "Connect" and look for test options
3. **Test with real hardware** by connecting your serial device

## Troubleshooting

- **Site not loading**: Wait 5-10 minutes for GitHub Pages to deploy
- **Web Serial API errors**: Ensure you're using Chrome/Edge
- **Permission issues**: Allow serial port access when prompted

## Next Steps

- Customize the chart colors in `script.js`
- Modify the baud rate if needed (default: 115200)
- Add your own branding and styling
- Consider adding data export features

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify all files are uploaded correctly
3. Ensure your device sends data in the correct JSON format
4. Test with the provided test data generator first