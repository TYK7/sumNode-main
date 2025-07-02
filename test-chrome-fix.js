#!/usr/bin/env node

/**
 * Test script to verify Chrome installation fix
 */

const { ensureChrome, findChromeExecutable } = require('./ensure-chrome');
const puppeteer = require('puppeteer');

async function testChromeFix() {
    console.log('🧪 Testing Chrome installation fix...');
    console.log('');
    
    // Test 1: Check if Chrome executable can be found
    console.log('Test 1: Finding Chrome executable...');
    const chromeExecutable = findChromeExecutable();
    if (chromeExecutable) {
        console.log('✅ Chrome executable found:', chromeExecutable);
    } else {
        console.log('❌ Chrome executable not found');
    }
    console.log('');
    
    // Test 2: Run ensureChrome function
    console.log('Test 2: Running ensureChrome...');
    const chromeReady = await ensureChrome();
    if (chromeReady) {
        console.log('✅ ensureChrome succeeded');
    } else {
        console.log('❌ ensureChrome failed');
    }
    console.log('');
    
    // Test 3: Try to launch Puppeteer with the found executable
    console.log('Test 3: Testing Puppeteer launch...');
    try {
        const launchOptions = {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            timeout: 30000
        };
        
        // Use the Chrome executable path if it was found
        if (process.env.CHROME_EXECUTABLE_PATH) {
            launchOptions.executablePath = process.env.CHROME_EXECUTABLE_PATH;
            console.log('Using Chrome executable:', process.env.CHROME_EXECUTABLE_PATH);
        }
        
        const browser = await puppeteer.launch(launchOptions);
        const version = await browser.version();
        console.log('✅ Puppeteer launch successful');
        console.log('🌐 Browser version:', version);
        
        // Test basic functionality
        const page = await browser.newPage();
        await page.goto('https://example.com', { waitUntil: 'networkidle2', timeout: 30000 });
        const title = await page.title();
        console.log('📄 Page title:', title);
        
        await browser.close();
        console.log('✅ Browser closed successfully');
        
    } catch (error) {
        console.log('❌ Puppeteer launch failed:', error.message);
    }
    
    console.log('');
    console.log('🎯 Test completed!');
}

// Run the test
testChromeFix().catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
});