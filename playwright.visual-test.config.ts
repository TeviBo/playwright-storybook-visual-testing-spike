import {defineConfig, devices} from "@playwright/test";

export default defineConfig({
    fullyParallel: true,
    updateSnapshots: process.env.CI ? 'all' : 'missing',
    testDir: "tests",
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    outputDir: 'tests/reports/playwright-results',
    timeout: 30 * 1000,
    reporter: process.env.CI ? [['line'], ['allure-playwright', {
        outputFolder: 'tests/reports/allure-results', detail: true, suiteTitle: true,
    }], ['html', {outputFolder: 'tests/reports/playwright-html'}],] : [['list'], ['allure-playwright', {
        outputFolder: 'tests/reports/allure-results', detail: true, suiteTitle: true, suiteSubtitle: true
    }], ['html', {
        outputFolder: 'tests/reports/playwright-html', open: 'never'
    }],],
    use: {
        baseURL: "http://localhost:6006",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
        video: process.env.CI ? "retain-on-failure" : "off",

        // Visual testing specific settings
        ignoreHTTPSErrors: true,
        actionTimeout: 10000,
        navigationTimeout: 30000,
    },
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
    }, {
        name: 'mobile-chrome', use: {...devices['Pixel 5']},
    }, {
        name: 'mobile-safari', use: {...devices['iPhone 12']},
    },], // Visual comparison settings
    expect: {
        toHaveScreenshot: {
            maxDiffPixels: 10, threshold: 0, animations: 'disabled',
        },
    },
    snapshotPathTemplate: '{testDir}/snapshots/{projectName}/{arg}{ext}',
});
