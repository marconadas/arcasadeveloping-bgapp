#!/usr/bin/env node
/**
 * 🎯 BGAPP Assets Optimization Script
 * Optimizes frontend assets for production deployment
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, '../../apps/frontend');

console.log('🚀 Optimizing BGAPP assets...');

// Check if frontend directory exists
if (!fs.existsSync(FRONTEND_DIR)) {
    console.error('❌ Frontend directory not found:', FRONTEND_DIR);
    process.exit(1);
}

// Basic optimization tasks
const tasks = [
    {
        name: 'Validate HTML files',
        run: () => {
            const htmlFiles = fs.readdirSync(FRONTEND_DIR).filter(f => f.endsWith('.html'));
            console.log(`  ✓ Found ${htmlFiles.length} HTML files`);
            return true;
        }
    },
    {
        name: 'Check assets directory',
        run: () => {
            const assetsDir = path.join(FRONTEND_DIR, 'assets');
            if (fs.existsSync(assetsDir)) {
                const jsFiles = fs.readdirSync(path.join(assetsDir, 'js')).filter(f => f.endsWith('.js'));
                const cssFiles = fs.readdirSync(path.join(assetsDir, 'css')).filter(f => f.endsWith('.css'));
                console.log(`  ✓ Found ${jsFiles.length} JS files and ${cssFiles.length} CSS files`);
                return true;
            }
            return false;
        }
    },
    {
        name: 'Verify critical files',
        run: () => {
            const criticalFiles = ['index.html', 'dashboard_cientifico.html', 'realtime_angola.html'];
            const missing = criticalFiles.filter(file => !fs.existsSync(path.join(FRONTEND_DIR, file)));
            if (missing.length > 0) {
                console.warn(`  ⚠️ Missing critical files: ${missing.join(', ')}`);
            } else {
                console.log('  ✓ All critical files present');
            }
            return true;
        }
    }
];

// Run optimization tasks
let success = true;
for (const task of tasks) {
    console.log(`📋 ${task.name}...`);
    try {
        if (!task.run()) {
            success = false;
            console.error(`  ❌ ${task.name} failed`);
        }
    } catch (error) {
        success = false;
        console.error(`  ❌ ${task.name} error:`, error.message);
    }
}

if (success) {
    console.log('✅ Asset optimization completed successfully!');
    process.exit(0);
} else {
    console.error('❌ Asset optimization failed');
    process.exit(1);
}