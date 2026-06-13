import { test, chromium, firefox, webkit } from '@playwright/test';

// Global setup for Playwright tests
export default async () => {
  console.log('Setting up Playwright test environment...');
  
  // Ensure the development server is ready
  console.log('Waiting for development server to start...');
  
  // Try to access the development server to ensure it's ready
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Wait for the server to be responsive
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    await browser.close();
    console.log('Development server is ready!');
  } catch (error) {
    console.warn('Could not connect to development server:', error);
    console.log('Tests will still run, but some features may not be available');
  }
  
  // Set up global environment variables if needed
  process.env.PLAYWRIGHT_TEST_BASE_URL = 'http://localhost:5173';
  
  console.log('Playwright test environment setup complete!');
};