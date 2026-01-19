const fs = require('fs');
const path = require('path');

const localesDir = 'src/lib/i18n/locales';
const zhCnPath = path.join(localesDir, 'zh-CN.ts');

function parseFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const keys = {};
    const lines = content.split('\n');
    lines.forEach(line => {
        const match = line.match(/^\s*"?([a-zA-Z0-9_.]+)"?:\s*"(.*)",?/);
        if (match) {
            keys[match[1]] = match[2];
        }
    });
    return keys;
}

const zhCnKeys = parseFile(zhCnPath);
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.ts') && f !== 'zh-CN.ts');

const missingReport = {};
const obsoleteReport = {};

files.forEach(file => {
    const filePath = path.join(localesDir, file);
    const keys = parseFile(filePath);

    // Check missing
    const missing = Object.keys(zhCnKeys).filter(k => !Object.prototype.hasOwnProperty.call(keys, k));
    if (missing.length > 0) {
        missingReport[file] = missing;
    }

    // Check obsolete
    const obsolete = Object.keys(keys).filter(k => !Object.prototype.hasOwnProperty.call(zhCnKeys, k));
    if (obsolete.length > 0) {
        obsoleteReport[file] = obsolete;
    }
});

console.log('--- Missing Keys Report ---');
console.log(JSON.stringify(missingReport, null, 2));

console.log('\n--- Obsolete Keys Report ---');
console.log(JSON.stringify(obsoleteReport, null, 2));
