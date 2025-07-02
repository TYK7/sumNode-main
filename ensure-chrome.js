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
    
    try {
        // First, try to launch Puppeteer to see if Chrome is already available
        console.log('🔍 [Chrome Installer] Testing Chrome availability...');
        const testBrowser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            timeout: 30000
        });
        
        const version = await testBrowser.version();
        console.log('✅ [Chrome Installer] Chrome is available:', version);
        await testBrowser.close();
        return true;
        
    } catch (error) {
        console.log('❌ [Chrome Installer] Chrome not available:', error.message);
        console.log('📦 [Chrome Installer] Attempting to install Chrome...');
        
        try {
            // Method 1: Try browser fetcher (for older Puppeteer versions)
            if (puppeteer.createBrowserFetcher) {
                console.log('🌐 [Chrome Installer] Using browser fetcher...');
                const browserFetcher = puppeteer.createBrowserFetcher({
                    path: '/opt/render/.cache/puppeteer'
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
                return true;
                
            } else {
                // Method 2: For newer Puppeteer versions, try to trigger auto-download
                console.log('🔄 [Chrome Installer] Triggering auto-download...');
                
                // Set environment to ensure download
                process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'false';
                process.env.PUPPETEER_CACHE_DIR = '/opt/render/.cache/puppeteer';
                
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

// Export for use in other modules
module.exports = { ensureChrome };

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