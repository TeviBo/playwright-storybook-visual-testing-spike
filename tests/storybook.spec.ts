import {expect, Page, test} from '@playwright/test';
import {
    getStoryRoot,
    getVisualCheckStories,
    navigateToStory,
    preparePageForVisualTest,
    sanitizeStoryId
} from './helpers/storybook-utils';
import {Story} from "./types/types";
import {TIMING_CONFIG} from "./config/visual-test.config";
import logger from "./utils/logger";

/**
 * Visual regression tests for Storybook stories tagged with 'visual:check'
 *
 * This suite automatically discovers and tests all stories marked with the 'visual:check' tag,
 * excluding documentation pages (stories ending with --docs)
 */

async function captureStorySnapshot(page: Page, story: Story): Promise<void> {
    logger.info(`\n📸 Testing: ${story.title} - ${story.name}`);
    logger.info(`   Story ID: ${story.id}`);
    await preparePageForVisualTest(page);
    await navigateToStory(page, story.id);
    const storyRoot = await getStoryRoot(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(TIMING_CONFIG.waitAfterLoad);
    const snapshotName = `${sanitizeStoryId(story.id)}.png`;
    logger.info(`   📁 Snapshot: ${snapshotName}`);
    await expect(storyRoot).toHaveScreenshot(snapshotName);
    logger.info(`   ✅ Snapshot captured successfully`);
}

function logTestSummary(stories: Story[], duration: number): void {
    logger.info(`\n${'='.repeat(60)}`);
    logger.info(`📊 VISUAL REGRESSION TEST SUMMARY`);
    logger.info(`${'='.repeat(60)}`);
    logger.info(`Total stories tested: ${stories.length}`);
    logger.info(`Duration: ${(duration / 1000).toFixed(2)}s`);
    logger.info(`Average per story: ${(duration / stories.length / 1000).toFixed(2)}s`);
    logger.info(`${'='.repeat(60)}\n`);
}

function validateStoriesFound(stories: Story[]): void {
    if (stories.length === 0) {
        throw new Error('No stories found with "visual:check" tag. Please ensure your stories have tags: ["visual:check"] in their configuration.');
    }
    logger.info(`✅ Found ${stories.length} stories (excluding docs pages)\n`);
    logger.info('📚 Stories to test:');
    for (const story of stories) {
        logger.info(`   ${stories.indexOf(story) + 1}. ${story.title} - ${story.name}`);
    }
    logger.info('');
}

// ============================================================================
// Test Suite
// ============================================================================

test.describe('Storybook Visual Regression Tests', () => {
    test('should capture visual snapshots for all tagged stories', async ({page}) => {
        const startTime = Date.now();
        logger.info('\n🔍 Discovering stories with "visual:check" tag...');
        const stories = await getVisualCheckStories(page);
        validateStoriesFound(stories);
        for (const story of stories) {
            await test.step(`${story.title} - ${story.name}`, async () => {
                await captureStorySnapshot(page, story);
            });
        }
        const duration = Date.now() - startTime;
        logTestSummary(stories, duration);
    });

    /**
     * Sanity check to ensure the test suite configuration is correct
     */
    test('should have visual:check tag system configured', async ({page}) => {
        const stories = await getVisualCheckStories(page);

        expect(stories.length).toBeGreaterThan(0);
        for (const story of stories) {
            expect(story.id).toBeDefined();
            expect(story.title).toBeDefined();
            expect(story.name).toBeDefined();
            expect(story.tags).toContain('visual:check');
            expect(story.id).not.toMatch(/--docs$/);
        }
        logger.info(`✅ Tag system validation passed for ${stories.length} stories`);
    });
});