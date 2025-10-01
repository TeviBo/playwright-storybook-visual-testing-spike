import {Page} from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import logger from '../config/logger';

export interface Story {
    id: string;
    title: string;
    name: string;
    tags?: string[];
    importPath: string;
}

export interface StorybookStory {
    id: string;
    title: string;
    name: string;
    tags?: string[];
    parameters?: any;
}

export class StorybookHelper {
    private baseUrl: string;
    private storybookStaticPath: string;

    constructor(baseUrl: string = 'http://192.168.0.40:6006') {
        this.baseUrl = baseUrl;
        this.storybookStaticPath = path.join(process.cwd(), 'storybook-static');
    }

    /**
     * Get all stories from Storybook's stories.json file
     */
    async getStoriesFromBuild(): Promise<StorybookStory[]> {
        try {
            const indexJsonPath = path.join(this.storybookStaticPath, 'index.json');

            if (!fs.existsSync(indexJsonPath)) {
                throw new Error(`index.json not found at ${indexJsonPath}. Make sure to run 'npm run build-storybook' first.`);
            }

            const indexData = JSON.parse(fs.readFileSync(indexJsonPath, 'utf-8'));
            const stories: StorybookStory[] = [];

            for (const [storyId, storyData] of Object.entries(indexData.entries)) {
                const story = storyData as any;
                stories.push({
                    id: storyId, title: story.title, name: story.name, tags: story.tags, parameters: story.parameters
                });
            }

            logger.info(`Found ${stories.length} stories in Storybook build`);
            return stories;
        } catch (error) {
            logger.error(`Failed to get stories from build: ${error}`);
            throw error;
        }
    }

    /**
     * Filter stories to only include showcase stories (not test stories)
     * PRIMARY: Uses 'visual:check' tag to identify showcase stories
     * SECONDARY: Excludes stories with *.test.stories.tsx pattern
     */
    filterShowcaseStories(stories: StorybookStory[]): StorybookStory[] {
        const showcaseStories = stories.filter(story => {
            // Primary filter: Must have 'visual:check' tag for showcase stories
            const hasVisualCheckTag = story.tags?.includes('visual:check');

            // Secondary filter: Exclude test stories based on naming pattern
            const isTestStory = story.id.includes('test-stories') || story.title.toLowerCase().includes('test') || story.tags?.includes('test');

            // A story is showcase if it has visual:check tag AND is not a test story
            const isShowcase = hasVisualCheckTag && !isTestStory;

            if (hasVisualCheckTag && !isTestStory) {
                logger.info(`✅ Including showcase story: ${story.title}/${story.name} (has visual:check tag)`);
            } else if (!hasVisualCheckTag) {
                logger.debug(`⏭️  Skipping story: ${story.title}/${story.name} (missing visual:check tag)`);
            } else if (isTestStory) {
                logger.debug(`⏭️  Skipping test story: ${story.title}/${story.name} (test story pattern)`);
            }

            return isShowcase;
        });

        logger.info(`🎯 Filtered to ${showcaseStories.length} showcase stories with 'visual:check' tag from ${stories.length} total stories`);

        if (showcaseStories.length === 0) {
            logger.warn(`⚠️  No stories found with 'visual:check' tag. Make sure your stories have tags: ['visual:check']`);
        }

        return showcaseStories;
    }

    /**
     * Navigate to a specific story in Storybook
     */
    async navigateToStory(page: Page, storyId: string): Promise<void> {
        const storyUrl = `${this.baseUrl}/iframe.html?id=${storyId}&viewMode=story`;
        logger.info(`Navigating to story: ${storyId} at ${storyUrl}`);

        await page.goto(storyUrl);

        // Wait for story to load
        await page.waitForSelector('#storybook-root', {timeout: 30000});

        // Additional wait to ensure all animations/transitions complete
        await page.waitForTimeout(1000);

        // Wait for network idle to ensure all resources are loaded
        await page.waitForLoadState('networkidle');
    }

    /**
     * Get story metadata for better test naming
     */
    getStoryTestName(story: StorybookStory): string {
        // Create a clean test name from story title and name
        const cleanTitle = story.title.replace(/[^a-zA-Z0-9]/g, '_');
        const cleanName = story.name.replace(/[^a-zA-Z0-9]/g, '_');
        return `${cleanTitle}__${cleanName}`;
    }

    /**
     * Wait for Storybook to be ready
     */
    async waitForStorybookReady(page: Page): Promise<void> {
        try {
            await page.goto(this.baseUrl);
            await page.waitForSelector('.sb-show-main', {timeout: 30000});
            logger.info('Storybook is ready');
        } catch (error) {
            logger.error(`Storybook not ready: ${error}`);
            throw new Error(`Storybook is not accessible at ${this.baseUrl}. Make sure it's running with 'npm run storybook'.`);
        }
    }

    /**
     * Take screenshot with consistent settings
     */
    async takeStoryScreenshot(page: Page, options?: {
        fullPage?: boolean; mask?: string[];
    }): Promise<Buffer> {
        const screenshotOptions: any = {
            fullPage: options?.fullPage || false, animations: 'disabled', caret: 'hide'
        };

        // Add masks if provided
        if (options?.mask && options.mask.length > 0) {
            screenshotOptions.mask = options.mask.map(selector => page.locator(selector));
        }

        return await page.screenshot(screenshotOptions);
    }
}