const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../dist/index.html');

if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8');

    if (!html.includes('manifest.json')) {
        const manifestLink = '<link rel="manifest" href="/manifest.json" />';
        html = html.replace('</head>', `${manifestLink}</head>`);
        fs.writeFileSync(indexPath, html);
        console.log('Injected manifest link into dist/index.html');
    } else {
        console.log('Manifest link already present.');
    }
} else {
    console.error('dist/index.html not found!');
    process.exit(1);
}
