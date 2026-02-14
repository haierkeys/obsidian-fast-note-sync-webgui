import { fileURLToPath, pathToFileURL } from 'url';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distConfigPath = path.resolve(__dirname, '../dist.ts');

async function main() {
    // 1. Check if dist.ts exists, if not create it
    if (!fs.existsSync(distConfigPath)) {
        console.log('dist.ts not found. Creating default configuration...');
        const defaultConfig = `export default {
    win: 'C:/Users/haier/DevApps/@JsApps/obsidian-better-sync/dist',
    mac: '/Users/haier/DevApps/@JsApps/obsidian-better-sync/dist'
};
`;
        fs.writeFileSync(distConfigPath, defaultConfig);
        console.log(`Created ${distConfigPath}. Please configure the paths according to your environment.`);
    }

    // 2. Import config dynamically
    const configModule = await import(pathToFileURL(distConfigPath).href);
    const config = configModule.default || configModule;

    const args = process.argv.slice(2);
    const targetKey = args[0];

    if (!targetKey) {
        console.error('Please specify a target (e.g., win, mac)');
        process.exit(1);
    }

    const targetPath = config[targetKey];

    if (!targetPath) {
        console.error(`Target "${targetKey}" not found in dist.ts`);
        process.exit(1);
    }

    const distPath = path.resolve(__dirname, '../dist');

    if (!fs.existsSync(distPath)) {
        console.error('dist directory not found. Please run build first.');
        process.exit(1);
    }

    // 3. Clean target directory
    if (fs.existsSync(targetPath)) {
        const absoluteTargetPath = path.resolve(targetPath);
        console.log(`Cleaning target directory: ${absoluteTargetPath}...`);

        try {
            if (process.platform === 'win32') {
                // On Windows, use a shell command to more aggressively remove items that might be locked or have path issues
                console.log('Using PowerShell for cleaning...');
                // Get-ChildItem -Path ... | Remove-Item -Recurse -Force
                const cmd = `powershell -Command "Get-ChildItem -Path '${absoluteTargetPath}' | Remove-Item -Recurse -Force"`;
                execSync(cmd, { stdio: 'inherit' });
            } else {
                const items = fs.readdirSync(absoluteTargetPath);
                console.log(`Found ${items.length} items in target directory.`);
                for (const item of items) {
                    const curPath = path.resolve(absoluteTargetPath, item);
                    console.log(`Removing: ${curPath}`);
                    fs.rmSync(curPath, { recursive: true, force: true });
                }
            }
            console.log('Cleanup finished.');
        } catch (error: any) {
            console.error(`Error during cleanup: ${error.message}`);
            // We'll continue anyway and try to copy, which might fail but let's see.
        }
    } else {
        console.log(`Target directory ${targetPath} does not exist. Creating it...`);
        fs.mkdirSync(targetPath, { recursive: true });
    }

    console.log(`Copying dist to ${targetPath}...`);
    copyRecursiveSync(distPath, targetPath);
    console.log('Copy complete!');
}

// Function to copy directory recursively
function copyRecursiveSync(src: string, dest: string) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        // Ensure destination directory exists for file (redundant if parent created, but good for safety)
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(src, dest);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
