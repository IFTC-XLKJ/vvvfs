import { build } from 'esbuild';
import fs from 'fs';

/**
 * 构建库
 */
build({
    entryPoints: ['index.ts'],
    bundle: true,
    outfile: 'dist/vvvfs.min.js',
    format: 'iife',
    minify: true,
    platform: 'browser',
    target: ["chrome72", "firefox126", "safari14", "edge79", "opera60"],
    logLevel: 'info',
    drop: ['console', 'debugger'],
}).catch(() => process.exit(1));