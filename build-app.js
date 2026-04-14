const fs = require('fs');
const path = require('path');

const sourceDir = __dirname;
const targetDir = path.join(__dirname, 'www');

// Create www directory if it doesn't exist
if (!fs.existsSync(targetDir)){
    fs.mkdirSync(targetDir);
}

// Folders and specific files to include in the build
const includeItems = [
    'assets',
    'articles',
    'app.js',
    'index.html',
    'loading.css',
    'style.css',
    'sponsors.js'
];

// Add any other .html files found in the root
const files = fs.readdirSync(sourceDir);
files.forEach(file => {
    if (file.endsWith('.html') && !includeItems.includes(file)) {
        includeItems.push(file);
    }
});

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }
        fs.readdirSync(src).forEach(function(childItemName) {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

includeItems.forEach(item => {
    const srcPath = path.join(sourceDir, item);
    const destPath = path.join(targetDir, item);
    if (fs.existsSync(srcPath)) {
        copyRecursiveSync(srcPath, destPath);
        console.log(`Copied ${item} to www/`);
    }
});

console.log('Build complete. Files copied to www/');
