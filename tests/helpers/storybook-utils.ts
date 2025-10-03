import {Locator, Page} from '@playwright/test';
import {Story, StorybookEntry, StorybookIndex} from "../types/types";
import logger from "../utils/logger";
import PlaywrightVisualTestConfig from "../../playwright.visual-test.config";
import {STORYBOOK_CONFIG} from "../config/visual-test.config";

const WAIT_CONFIG = {
    networkIdleTimeout: 10000, selectorTimeout: 10000, animationSettleTime: 500,
};

// ============================================================================
// Story Discovery
// ============================================================================

/**
 * Fetches all stories from Storybook with the visual:check tag
 * Excludes documentation pages (stories ending with --docs)
 *
 * @param page - Playwright page instance
 * @returns Array of stories marked for visual testing
 */
export async function getVisualCheckStories(page: Page): Promise<Story[]> {
    await page.goto(PlaywrightVisualTestConfig.use.baseURL);
    await page.waitForLoadState('networkidle', {
        timeout: WAIT_CONFIG.networkIdleTimeout
    });
    const storiesJson = await fetchStorybookIndex(page);
    return filterVisualCheckStories(storiesJson);
}

/**
 * Fetches the Storybook index.json file
 * @param page - Playwright page instance
 * @returns Parsed Storybook index
 */
async function fetchStorybookIndex(page: Page): Promise<StorybookIndex> {
    return await page.evaluate(async (indexPath) => {
        const response = await fetch(indexPath);
        if (!response.ok) {
            throw new Error(`Failed to fetch Storybook index: ${response.statusText}`);
        }
        return response.json();
    }, STORYBOOK_CONFIG.indexPath);
}

/**
 * Filters stories that should be visually tested
 * @param storiesJson - Storybook index data
 * @returns Filtered array of stories
 */
function filterVisualCheckStories(storiesJson: StorybookIndex): Story[] {
    const visualStories: Story[] = [];

    if (!storiesJson.entries) {
        logger.warn('No entries found in Storybook index.json');
        return visualStories;
    }

    for (const [id, entry] of Object.entries(storiesJson.entries)) {
        if (shouldIncludeStory(id, entry)) {
            visualStories.push(transformStoryEntry(id, entry));
        }
    }

    return visualStories;
}

/**
 * Determines if a story should be included in visual tests
 * @param id - Story ID
 * @param entry - Story entry from index
 * @returns True if story should be tested
 */
function shouldIncludeStory(id: string, entry: StorybookEntry): boolean {
    const tags = entry.tags || [];
    const hasVisualCheckTag = tags.includes(STORYBOOK_CONFIG.visualCheckTag);
    const isNotDocsPage = !id.endsWith(STORYBOOK_CONFIG.excludedSuffix);
    return hasVisualCheckTag && isNotDocsPage;
}

/**
 * Transforms a Storybook entry into a Story object
 * @param id - Story ID
 * @param entry - Story entry from index
 * @returns Transformed Story object
 */
function transformStoryEntry(id: string, entry: StorybookEntry): Story {
    return {
        id, title: entry.title, name: entry.name, kind: entry.title, tags: entry.tags || [],
    };
}

// ============================================================================
// Navigation
// ============================================================================

/**
 * Navigates to a specific story and waits for it to render
 *
 * @param page - Playwright page instance
 * @param storyId - Story ID to navigate to
 * @param waitForSelector - Optional selector to wait for
 */
export async function navigateToStory(page: Page, storyId: string, waitForSelector?: string): Promise<void> {
    const url = buildStoryUrl(storyId);
    await page.goto(url);
    await page.waitForLoadState('networkidle', {
        timeout: WAIT_CONFIG.networkIdleTimeout,
    });

    if (waitForSelector) {
        await page.waitForSelector(waitForSelector, {
            timeout: WAIT_CONFIG.selectorTimeout
        });
    }
    await page.waitForTimeout(WAIT_CONFIG.animationSettleTime);
}

/**
 * Builds the URL for a specific story
 * @param storyId - Story ID
 * @returns Full story URL
 */
function buildStoryUrl(storyId: string): string {
    return `${PlaywrightVisualTestConfig.use.baseURL}${STORYBOOK_CONFIG.iframePath}?id=${storyId}&viewMode=story`;
}

// ============================================================================
// Page Preparation
// ============================================================================

/**
 * Prepares the page for visual testing
 * Disables animations and ensures consistent rendering
 *
 * @param page - Playwright page instance
 */
export async function preparePageForVisualTest(page: Page): Promise<void> {
    await disableAnimations(page);
}

/**
 * Disables CSS animations and transitions for consistent screenshots
 * @param page - Playwright page instance
 */
async function disableAnimations(page: Page): Promise<void> {
    await page.addStyleTag({
        content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        scroll-behavior: auto !important;
      }
    `,
    });
}

// ============================================================================
// Element Helpers
// ============================================================================

export async function getStoryRoot(page: Page): Promise<Locator> {
    return page.locator(STORYBOOK_CONFIG.storyRootSelector);
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Sanitizes story ID to create a valid filename
 * Replaces non-alphanumeric characters with hyphens
 *
 * @param storyId - Story ID to sanitize
 * @returns Sanitized filename-safe string
 */
export function sanitizeStoryId(storyId: string): string {
    return storyId
        .replace(/[^a-z0-9-]/gi, '-')
        .toLowerCase()
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

