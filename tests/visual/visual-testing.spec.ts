import {expect, test} from '@playwright/test';
import {StorybookHelper, StorybookStory} from '../utils/storybook';
import {createStorageFromEnv, SnapshotStorage} from '../utils/storage';
import logger from '../config/logger';
import * as fs from 'fs';
import * as path from 'path';

// Global variables for the test suite
let storybookHelper: StorybookHelper;
let storage: SnapshotStorage;
let showcaseStories: StorybookStory[];

test.describe('Storybook Visual Testing', () => {
    test.beforeAll(async () => {
        logger.info('Initializing visual testing suite');

        // Initialize Storybook helper
        storybookHelper = new StorybookHelper(process.env.STORYBOOK_URL || 'http://192.168.0.40:6006');

        // Initialize storage
        storage = createStorageFromEnv();

        // Get all stories and filter to showcase only
        const allStories = await storybookHelper.getStoriesFromBuild();
        showcaseStories = storybookHelper.filterShowcaseStories(allStories);

        logger.info(`Prepared ${showcaseStories.length} showcase stories for visual testing`);
    });

    // Generate dynamic tests for each showcase story
    showcaseStories?.forEach((story: StorybookStory) => {
        test(`Visual test: ${story.title} - ${story.name}`, async ({page, browserName}, testInfo) => {
            const testName = storybookHelper.getStoryTestName(story);
            const platform = process.platform;
            const browser = browserName || 'unknown';

            logger.info(`Starting visual test for story: ${story.id}`, {
                testName, browser, platform, storyId: story.id
            });

            try {
                // Navigate to the specific story
                await storybookHelper.navigateToStory(page, story.id);

                // Wait for story to be fully loaded
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500); // Additional wait for animations

                // Generate snapshot key for storage
                const snapshotKey = storage.generateSnapshotKey(testName, browser, platform);

                // Take screenshot
                const screenshot = await storybookHelper.takeStoryScreenshot(page, {
                    fullPage: false, mask: [// Mask any dynamic elements that shouldn't affect visual comparison
                        '[data-testid="timestamp"]', '.sb-show-addons' // Hide Storybook addons panel if visible
                    ]
                });

                // Local snapshot path
                const localSnapshotDir = path.join(testInfo.outputDir, 'snapshots');
                const localSnapshotPath = path.join(localSnapshotDir, `${testName}-${browser}.png`);

                // Ensure local snapshot directory exists
                if (!fs.existsSync(localSnapshotDir)) {
                    fs.mkdirSync(localSnapshotDir, {recursive: true});
                }

                // Save screenshot locally
                fs.writeFileSync(localSnapshotPath, screenshot);

                // Check if baseline exists in storage
                const baselineExists = await storage.snapshotExists(snapshotKey);

                if (!baselineExists) {
                    // This is the first run - upload as baseline
                    await storage.uploadSnapshot(localSnapshotPath, snapshotKey);
                    logger.info(`Baseline snapshot uploaded for ${testName}`, {snapshotKey});

                    // Mark test as passed but note it's a baseline creation
                    testInfo.annotations.push({
                        type: 'info', description: `Baseline snapshot created: ${snapshotKey}`
                    });

                    return; // Skip comparison for baseline creation
                }

                // Download baseline for comparison
                const baselineDir = path.join(testInfo.outputDir, 'baselines');
                const baselinePath = path.join(baselineDir, `${testName}-${browser}-baseline.png`);

                if (!fs.existsSync(baselineDir)) {
                    fs.mkdirSync(baselineDir, {recursive: true});
                }

                const downloadSuccess = await storage.downloadSnapshot(snapshotKey, baselinePath);

                if (!downloadSuccess) {
                    throw new Error(`Failed to download baseline snapshot: ${snapshotKey}`);
                }

                // Perform visual comparison using Playwright's built-in comparison
                await expect.soft(screenshot).toMatchSnapshot(`${testName}-${browser}.png`, {
                    // Custom comparison settings
                    threshold: parseFloat(process.env.VISUAL_THRESHOLD || '0.2'), // 20% threshold by default
                    maxDiffPixels: parseInt(process.env.MAX_DIFF_PIXELS || '100')
                });

                // If comparison passes, we're done
                // If comparison fails, Playwright will generate diff images automatically

                logger.info(`Visual comparison completed for ${testName}`, {
                    snapshotKey, browser, platform
                });

            } catch (error) {
                logger.error(`Visual test failed for story ${story.id}:`, error);

                // Attach additional context to test failure
                testInfo.annotations.push({
                    type: 'error', description: `Visual test failed: ${error}`
                });

                throw error;
            }
        });
    });

    // Health check test to ensure Storybook is accessible
    test('Storybook Health Check', async ({page}) => {
        logger.info('Running Storybook health check');

        await storybookHelper.waitForStorybookReady(page);

        // Verify main Storybook elements are present
        await expect(page.locator('.sb-show-main')).toBeVisible();

        logger.info('Storybook health check passed');
    });
});

// Additional test suite for baseline management
test.describe('Baseline Management', () => {
    test('Update baselines', async ({page, browserName}, testInfo) => {
        // This test runs only when UPDATE_BASELINES=true
        test.skip(!process.env.UPDATE_BASELINES, 'Baseline update not requested');

        const browser = browserName || 'unknown';
        const platform = process.platform;

        logger.info('Starting baseline update process');

        if (!storage) {
            storage = createStorageFromEnv();
        }

        if (!storybookHelper) {
            storybookHelper = new StorybookHelper();
        }

        if (!showcaseStories) {
            const allStories = await storybookHelper.getStoriesFromBuild();
            showcaseStories = storybookHelper.filterShowcaseStories(allStories);
        }

        let updatedCount = 0;

        for (const story of showcaseStories) {
            try {
                const testName = storybookHelper.getStoryTestName(story);
                const snapshotKey = storage.generateSnapshotKey(testName, browser, platform);

                await storybookHelper.navigateToStory(page, story.id);
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                const screenshot = await storybookHelper.takeStoryScreenshot(page);

                const tempPath = path.join(testInfo.outputDir, 'temp', `${testName}-${browser}.png`);
                const tempDir = path.dirname(tempPath);

                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, {recursive: true});
                }

                fs.writeFileSync(tempPath, screenshot);

                await storage.uploadSnapshot(tempPath, snapshotKey);
                updatedCount++;

                logger.info(`Updated baseline for ${testName}`);

            } catch (error) {
                logger.error(`Failed to update baseline for ${story.id}:`, error);
            }
        }

        logger.info(`Updated ${updatedCount} baselines out of ${showcaseStories.length} stories`);
    });
});