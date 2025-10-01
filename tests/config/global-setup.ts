import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import logger from './logger';

async function globalSetup(config: FullConfig) {
  logger.info('Starting global setup for visual testing framework');

  const dirs = [
    'tests/logs',
    'tests/snapshots',
    'tests/reports/allure-results',
    'tests/reports/playwright-html',
    'tests/temp'
  ];

  dirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.info(`Created directory: ${dirPath}`);
    }
  });

  // Check if Storybook is running (for local development)
  if (!process.env.CI) {
    try {
      const browser = await chromium.launch();
      const page = await browser.newPage();
      
      await page.goto('http://localhost:6006', { timeout: 5000 });
      await page.close();
      await browser.close();
      
      logger.info('Storybook is accessible at http://localhost:6006');
    } catch (error) {
      logger.error('Storybook is not running. Please start it with: npm run storybook.' +
          `Trace: \`${error.message}\` at ${error.stack.split('\n')[0]}`);
      throw new Error('Storybook must be running for visual tests. Run: npm run storybook');
    }
  }

  // Check if storybook-static build exists for CI
  if (process.env.CI) {
    const storybookStaticPath = path.join(process.cwd(), 'storybook-static');
    if (!fs.existsSync(storybookStaticPath)) {
      logger.error('storybook-static build not found. Run: npm run build-storybook');
      throw new Error('Storybook static build required for CI. Run: npm run build-storybook');
    }
    logger.info('Found storybook-static build for CI');
  }

  // Log environment information
  logger.info('Environment variables:', {
    NODE_ENV: process.env.NODE_ENV,
    CI: process.env.CI,
    STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || 'minio',
    STORAGE_BUCKET: process.env.STORAGE_BUCKET || 'visual-test-snapshots',
    STORAGE_ENDPOINT: process.env.STORAGE_ENDPOINT || 'localhost',
  });

  logger.info('Global setup completed successfully');
}

export default globalSetup;