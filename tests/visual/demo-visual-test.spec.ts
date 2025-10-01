import { test, expect } from '@playwright/test';
import { StorybookHelper } from '../utils/storybook';
import { SnapshotStorage, createStorageFromEnv } from '../utils/storage';
import logger from '../config/logger';
import fs from 'fs';
import path from 'path';

// Initialize components
const storybookHelper = new StorybookHelper(process.env.STORYBOOK_URL || 'http://localhost:6006');
const storage = createStorageFromEnv();

test.describe('Demo: Storybook Visual Testing', () => {
  
  test('Health Check: Storybook is accessible', async ({ page }) => {
    logger.info('Running Storybook health check');
    
    // Navigate to Storybook
    await page.goto('http://localhost:6006');
    
    // Wait for Storybook to load
    await page.waitForSelector('.sb-show-main', { timeout: 10000 });
    
    logger.info('✅ Storybook health check passed');
  });

  // Test the Button Primary story
  test('Visual: Button Primary', async ({ page, browserName }, testInfo) => {
    const storyId = 'example-button--primary';
    const testName = 'Example_Button__Primary';
    const browser = browserName || 'chromium';
    const platform = process.platform;

    logger.info(`Testing story: ${storyId} on ${browser}`);

    try {
      // Navigate to the story
      const storyUrl = `http://localhost:6006/iframe.html?id=${storyId}&viewMode=story`;
      await page.goto(storyUrl);
      
      // Wait for story to load
      await page.waitForSelector('#storybook-root', { timeout: 10000 });
      await page.waitForTimeout(1000); // Extra wait for stability
      
      // Take screenshot
      const screenshot = await page.screenshot({
        animations: 'disabled',
        caret: 'hide'
      });
      
      // Save to local directory
      const localDir = path.join(testInfo.outputDir, 'screenshots');
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      
      const localPath = path.join(localDir, `${testName}-${browser}.png`);
      fs.writeFileSync(localPath, screenshot);
      
      // Generate storage key
      const snapshotKey = storage.generateSnapshotKey(testName, browser, platform);
      
      // Check if this is first run (no baseline exists)
      const baselineExists = await storage.snapshotExists(snapshotKey);
      
      if (!baselineExists) {
        logger.info(`📸 Creating baseline for ${testName}`);
        await storage.uploadSnapshot(localPath, snapshotKey);
        
        testInfo.annotations.push({
          type: 'info',
          description: `Baseline created: ${snapshotKey}`
        });
      } else {
        logger.info(`🔍 Comparing against baseline for ${testName}`);
        
        // Download baseline
        const baselineDir = path.join(testInfo.outputDir, 'baselines');
        if (!fs.existsSync(baselineDir)) {
          fs.mkdirSync(baselineDir, { recursive: true });
        }
        
        const baselinePath = path.join(baselineDir, `${testName}-${browser}-baseline.png`);
        await storage.downloadSnapshot(snapshotKey, baselinePath);
        
        // Use Playwright's visual comparison
        await expect(screenshot).toMatchSnapshot(`${testName}-${browser}.png`, {
          threshold: 0.2,
          maxDiffPixels: 100
        });
      }
      
      logger.info(`✅ Visual test completed for ${testName}`);
      
    } catch (error) {
      logger.error(`❌ Visual test failed for ${storyId}:`, error);
      throw error;
    }
  });

  // Test other Button variants
  const buttonVariants = [
    { id: 'example-button--secondary', name: 'Secondary' },
    { id: 'example-button--large', name: 'Large' },
    { id: 'example-button--small', name: 'Small' }
  ];

  buttonVariants.forEach(({ id, name }) => {
    test(`Visual: Button ${name}`, async ({ page, browserName }, testInfo) => {
      const testName = `Example_Button__${name}`;
      const browser = browserName || 'chromium';
      const platform = process.platform;

      logger.info(`Testing Button ${name} variant`);

      try {
        await page.goto(`http://localhost:6006/iframe.html?id=${id}&viewMode=story`);
        await page.waitForSelector('#storybook-root', { timeout: 10000 });
        await page.waitForTimeout(1000);
        
        const screenshot = await page.screenshot({
          animations: 'disabled',
          caret: 'hide'
        });
        
        const localDir = path.join(testInfo.outputDir, 'screenshots');
        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }
        
        const localPath = path.join(localDir, `${testName}-${browser}.png`);
        fs.writeFileSync(localPath, screenshot);
        
        const snapshotKey = storage.generateSnapshotKey(testName, browser, platform);
        const baselineExists = await storage.snapshotExists(snapshotKey);
        
        if (!baselineExists) {
          logger.info(`📸 Creating baseline for Button ${name}`);
          await storage.uploadSnapshot(localPath, snapshotKey);
          testInfo.annotations.push({
            type: 'info',
            description: `Baseline created: ${snapshotKey}`
          });
        } else {
          logger.info(`🔍 Comparing Button ${name} against baseline`);
          
          const baselineDir = path.join(testInfo.outputDir, 'baselines');
          if (!fs.existsSync(baselineDir)) {
            fs.mkdirSync(baselineDir, { recursive: true });
          }
          
          const baselinePath = path.join(baselineDir, `${testName}-${browser}-baseline.png`);
          await storage.downloadSnapshot(snapshotKey, baselinePath);
          
          await expect(screenshot).toMatchSnapshot(`${testName}-${browser}.png`, {
            threshold: 0.2,
            maxDiffPixels: 100
          });
        }
        
        logger.info(`✅ Button ${name} visual test completed`);
        
      } catch (error) {
        logger.error(`❌ Button ${name} visual test failed:`, error);
        throw error;
      }
    });
  });
  
});