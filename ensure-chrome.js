#!/usr/bin/env node

/**
 * Runtime Chrome installer for Render deployment
 * This ensures Chrome is available when the server starts
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function ensureChrome() {
    console.log('🔧 [Chrome Installer] Starting Chrome availability check...');
    
    // First, check if Chrome is already installed in the expected locations
    const chromeExecutable = findChromeExecutable();
    if (chromeExecutable) {
        console.log('✅ [Chrome Installer] Found Chrome executable:', chromeExecutable);
        
        // Test the found executable
        try {
            const testBrowser = await puppeteer.launch({
                headless: true,
                executablePath: chromeExecutable,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                timeout: 30000
            });
            
            const version = await testBrowser.version();
            console.log('✅ [Chrome Installer] Chrome is working:', version);
            await testBrowser.close();
            
            // Store the working executable path for later use
            process.env.CHROME_EXECUTABLE_PATH = chromeExecutable;
            return true;
            
        } catch (error) {
            console.log('❌ [Chrome Installer] Found Chrome but failed to launch:', error.message);
        }
    }
    
    try {
        // Try to launch Puppeteer without specifying executable path
        console.log('🔍 [Chrome Installer] Testing default Puppeteer Chrome...');
        const testBrowser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            timeout: 30000
        });
        
        const version = await testBrowser.version();
        console.log('✅ [Chrome Installer] Default Chrome is available:', version);
        await testBrowser.close();
        return true;
        
    } catch (error) {
        console.log('❌ [Chrome Installer] Default Chrome not available:', error.message);
        console.log('📦 [Chrome Installer] Attempting to install Chrome...');
        
        try {
            // Method 1: Try browser fetcher (for older Puppeteer versions)
            if (puppeteer.createBrowserFetcher) {
                console.log('🌐 [Chrome Installer] Using browser fetcher...');
                const browserFetcher = puppeteer.createBrowserFetcher({
                    path: process.env.PUPPETEER_CACHE_DIR || '/opt/render/.cache/puppeteer'
                });
                
                const revisionInfo = await browserFetcher.download();
                console.log('✅ [Chrome Installer] Chrome downloaded to:', revisionInfo.executablePath);
                
                // Verify the download worked
                const verifyBrowser = await puppeteer.launch({
                    headless: true,
                    executablePath: revisionInfo.executablePath,
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
                await verifyBrowser.close();
                console.log('✅ [Chrome Installer] Chrome installation verified');
                
                // Store the working executable path
                process.env.CHROME_EXECUTABLE_PATH = revisionInfo.executablePath;
                return true;
                
            } else {
                // Method 2: For newer Puppeteer versions, try to trigger auto-download
                console.log('🔄 [Chrome Installer] Triggering auto-download...');
                
                // Set environment to ensure download
                process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'false';
                if (!process.env.PUPPETEER_CACHE_DIR) {
                    process.env.PUPPETEER_CACHE_DIR = '/opt/render/.cache/puppeteer';
                }
                
                // Try to launch - this should trigger download
                const browser = await puppeteer.launch({
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox'],
                    timeout: 60000 // Give more time for download
                });
                
                const version = await browser.version();
                console.log('✅ [Chrome Installer] Chrome auto-download successful:', version);
                await browser.close();
                return true;
            }
            
        } catch (installError) {
            console.log('❌ [Chrome Installer] Installation failed:', installError.message);
            
            // Method 3: Check for system Chrome as fallback
            console.log('🔍 [Chrome Installer] Checking for system Chrome...');
            const systemPaths = [
                '/usr/bin/google-chrome-stable',
                '/usr/bin/google-chrome',
                '/usr/bin/chromium-browser',
                '/usr/bin/chromium'
            ];
            
            for (const chromePath of systemPaths) {
                if (fs.existsSync(chromePath)) {
                    console.log('✅ [Chrome Installer] Found system Chrome:', chromePath);
                    
                    // Test system Chrome
                    try {
                        const browser = await puppeteer.launch({
                            headless: true,
                            executablePath: chromePath,
                            args: ['--no-sandbox', '--disable-setuid-sandbox']
                        });
                        await browser.close();
                        console.log('✅ [Chrome Installer] System Chrome verified');
                        
                        // Store the working executable path
                        process.env.CHROME_EXECUTABLE_PATH = chromePath;
                        return true;
                    } catch (testError) {
                        console.log('❌ [Chrome Installer] System Chrome test failed:', testError.message);
                    }
                }
            }
            
            console.log('❌ [Chrome Installer] All installation methods failed');
            return false;
        }
    }
}

/**
 * Find Chrome executable in common locations
 */
function findChromeExecutable() {
    const possiblePaths = [
        // Render-specific paths
        '/opt/render/.cache/puppeteer/chrome/linux-127.0.6533.88/chrome-linux64/chrome',
        '/opt/render/.cache/puppeteer/chrome/linux-*/chrome-linux64/chrome',
        
        // Generic cache paths
        process.env.PUPPETEER_CACHE_DIR && path.join(process.env.PUPPETEER_CACHE_DIR, 'chrome/linux-*/chrome-linux64/chrome'),
        
        // System Chrome paths
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium'
    ].filter(Boolean);
    
    for (const chromePath of possiblePaths) {
        if (chromePath.includes('*')) {
            // Handle wildcard paths
            const baseDir = chromePath.split('*')[0];
            if (fs.existsSync(baseDir)) {
                try {
                    const dirs = fs.readdirSync(baseDir);
                    for (const dir of dirs) {
                        const fullPath = path.join(baseDir, dir, 'chrome-linux64/chrome');
                        if (fs.existsSync(fullPath)) {
                            console.log('🔍 [Chrome Installer] Found Chrome at:', fullPath);
                            return fullPath;
                        }
                    }
                } catch (error) {
                    // Continue to next path
                }
            }
        } else if (fs.existsSync(chromePath)) {
            console.log('🔍 [Chrome Installer] Found Chrome at:', chromePath);
            return chromePath;
        }
    }
    
    return null;
}

// Export for use in other modules
module.exports = { ensureChrome, findChromeExecutable };

// If run directly, execute the installer
if (require.main === module) {
    ensureChrome()
        .then(success => {
            if (success) {
                console.log('🎉 [Chrome Installer] Chrome is ready!');
                process.exit(0);
            } else {
                console.log('💥 [Chrome Installer] Chrome installation failed!');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 [Chrome Installer] Unexpected error:', error);
            process.exit(1);
        });
}