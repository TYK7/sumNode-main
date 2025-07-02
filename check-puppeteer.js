#!/usr/bin/env node

/**
 * Debug script to check Puppeteer installation and Chrome availability
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Puppeteer installation...');

try {
    const puppeteer = require('puppeteer');
    console.log('✅ Puppeteer package loaded successfully');
    
    // Check cache directories
    const cacheDir = process.env.PUPPETEER_CACHE_DIR || '/opt/render/project/.cache/puppeteer';
    console.log(`📁 Checking cache directory: ${cacheDir}`);
    
    if (fs.existsSync(cacheDir)) {
        console.log('✅ Cache directory exists');
        
        // List contents
        try {
            const contents = fs.readdirSync(cacheDir);
            console.log('📋 Cache directory contents:', contents);
            
            // Check for chrome directory
            const chromeDir = path.join(cacheDir, 'chrome');
            if (fs.existsSync(chromeDir)) {
                console.log('✅ Chrome directory found');
                const chromeContents = fs.readdirSync(chromeDir);
                console.log('📋 Chrome directory contents:', chromeContents);
                
                // Look for executables
                for (const item of chromeContents) {
                    const itemPath = path.join(chromeDir, item);
                    if (fs.statSync(itemPath).isDirectory()) {
                        const execPath = path.join(itemPath, 'chrome-linux64', 'chrome');
                        if (fs.existsSync(execPath)) {
                            console.log(`✅ Found Chrome executable: ${execPath}`);
                        } else {
                            console.log(`❌ Chrome executable not found at: ${execPath}`);
                        }
                    }
                }
            } else {
                console.log('❌ Chrome directory not found');
            }
        } catch (error) {
            console.log('❌ Error reading cache directory:', error.message);
        }
    } else {
        console.log('❌ Cache directory does not exist');
    }
    
    // Try to launch Puppeteer
    console.log('🚀 Attempting to launch Puppeteer...');
    
    (async () => {
        try {
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            console.log('✅ Puppeteer launched successfully');
            await browser.close();
            console.log('✅ Browser closed successfully');
        } catch (error) {
            console.log('❌ Failed to launch Puppeteer:', error.message);
        }
    })();
    
} catch (error) {
    console.log('❌ Error loading Puppeteer:', error.message);
}