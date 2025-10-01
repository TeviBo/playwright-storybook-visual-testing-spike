import {defineConfig, devices} from "@playwright/test";

export default defineConfig({
    snapshotDir: "./tests/snapshots",
    testDir: "./tests",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,

    // Configure reporters - Allure for visual testing, HTML for backup
    reporter: process.env.CI ? [['line'], ['allure-playwright', {outputFolder: 'tests/reports/allure-results'}], ['html', {outputFolder: 'tests/reports/playwright-html'}]] : [['list'], ['allure-playwright', {outputFolder: 'tests/reports/allure-results'}], ['html', {
        outputFolder: 'tests/reports/playwright-html',
        open: 'never'
    }]],

    use: {
        baseURL: "http://192.168.0.40:6006/",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
        video: process.env.CI ? "retain-on-failure" : "off",

        // Visual testing specific settings
        ignoreHTTPSErrors: true,
        actionTimeout: 10000,
        navigationTimeout: 30000,
    },

    // Configure browsers for visual testing
    projects: [{
        name: 'chromium', use: {
            ...devices['Desktop Chrome'], viewport: {width: 1280, height: 720},
        },
    }, {
        name: 'firefox', use: {
            ...devices['Desktop Firefox'], viewport: {width: 1280, height: 720},
        },
    }, {
        name: 'webkit', use: {
            ...devices['Desktop Safari'], viewport: {width: 1280, height: 720},
        },
    }, // Mobile testing
        {
            name: 'mobile-chrome', use: {...devices['Pixel 5']},
        }, {
            name: 'mobile-safari', use: {...devices['iPhone 12']},
        },],

    // Global setup and teardown
    globalSetup: './tests/config/global-setup',
    globalTeardown: "./tests/config/global-teardown"
});
