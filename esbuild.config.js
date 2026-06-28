import { build } from 'esbuild';
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

build({
    entryPoints: ['index.ts'],
    bundle: true,
    outfile: 'dist/vvvfs.min.js',
    format: 'iife',
    define: {
        'process.env.PACKAGE_VERSION': JSON.stringify(pkg.version),
    },
    minify: true,
    platform: 'browser',
    target: ["chrome80", "firefox70", "safari13", "edge80"],
    logLevel: 'info',
    drop: ['console', 'debugger'],
}).catch(() => process.exit(1));