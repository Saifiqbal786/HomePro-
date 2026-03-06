const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, 'frontend', 'src', 'pages');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.html')) results.push(file);
        }
    });
    return results;
}

const htmlFiles = walk(PAGES_DIR);
let updatedCount = 0;

htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Check if it's already injected
    if (!content.includes('src="/src/assets/js/i18n.js"')) {
        // Inject right before the closing body tag
        const injection = '\n    <!-- Bilingual Support -->\n    <script src="/src/assets/js/i18n.js"></script>\n</body>';
        content = content.replace('</body>', injection);
        fs.writeFileSync(file, content);
        updatedCount++;
        console.log(`Injected into: ${path.relative(__dirname, file)}`);
    } else {
        console.log(`Skipped (already injected): ${path.relative(__dirname, file)}`);
    }
});

console.log(`\nSuccessfully injected i18n logic into ${updatedCount} HTML files!`);
