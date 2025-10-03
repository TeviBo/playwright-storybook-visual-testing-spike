# Visual Regression Testing with Playwright & Storybook

This directory contains the visual regression testing setup for Storybook components using Playwright.

## 📁 Directory Structure

```
tests/
├── config/
│   │   └── visual-test.visual-test.config.ts    # Test configuration
├── reports/
│   ├── playwright-html/             # HTML test reports
│   └── allure-results/              # Allure test results
├── utils/
│   │   └── logger.ts                # Logger utility for test output
├── visual/
│   ├── helpers/
│   │   └── storybook-utils.ts       # Utility functions
│   ├── snapshots/
│   │   └── chromium/                # Baseline screenshots
│   │       └── storybook.spec.ts/
│   │           └── *.png
│   └── storybook.spec.ts            # Main test file
└── README.md                        # This file
```

## 🎯 How It Works

1. **Story Discovery**: Tests automatically discover all Storybook stories tagged with `visual:check`
2. **Snapshot Capture**: Takes screenshots of each tagged story
3. **Visual Comparison**: Compares screenshots with baseline images
4. **Report Generation**: Creates detailed reports showing any visual differences

## 🏷️ Tagging Stories for Visual Testing

Add the `visual:check` tag to any story you want to test:

```typescript
export const Primary: Story = {
    args: {
        label: 'Button',
    },
    tags: ['visual:check'], // ← Add this tag
};
```

**Note**: Documentation pages (stories ending with `--docs`) are automatically excluded.

## 🚀 Running Tests

### Start Storybook (Required)

```bash
npm run storybook
```

### Run Visual Tests

```bash
# Run tests (headless)
npm run test:visual

# Run tests with UI
npm run test:visual:ui

# Run tests in headed mode (see browser)
npm run test:visual:headed

# Debug tests step-by-step
npm run test:visual:debug
```

### Generate/Update Baseline Snapshots

```bash
# First time or when intentional changes are made
npm run test:visual:update
```

## 📊 View Reports

### Playwright HTML Report

```bash
npm run reports:playwright
```

### Allure Report

```bash
npm run reports:allure
```

## ⚙️ Configuration

### Test Configuration

Edit `tests/config/visual-test.config.ts` to adjust:

- Screenshot comparison thresholds
- Timing and wait configurations
- Tag system settings
- Logging preferences

### Playwright Configuration

Edit `playwright.visual-test.config.ts` at project root to adjust:

- Browsers to test
- Viewport sizes
- Reporter settings
- Snapshot path locations

## 🔧 Customization

### Adjust Visual Comparison Sensitivity

In `playwright.visual-test.config.ts`:

```typescript
import {defineConfig, devices} from "@playwright/test";

export default defineConfig({
    ...config,
    expect: {
        toHaveScreenshot: {
            maxDiffPixels: 10,  // Increase to allow more pixel differences
            threshold: 0,  // Increase to allow more color variation
            animations: 'disabled'
        }
    }
});
```

### Change Wait Times

In `visual-test.config.ts`:

```typescript
export const TIMING_CONFIG = {
    waitAfterLoad: 500,  // Increase if components need more time to settle
};
```

### Add More Browsers

In `playwright.visual-test.config.ts`:

```typescript
projects: [
    {name: 'chromium', use: {...devices['Desktop Chrome']}},
    {name: 'firefox', use: {...devices['Desktop Firefox']}},
    {name: 'webkit', use: {...devices['Desktop Safari']}},
]
```

**Note**: Each browser needs its own baseline snapshots.

## 🐛 Troubleshooting

### No snapshots being created

1. Check Storybook is running on port 6006
2. Verify stories have `tags: ['visual:check']`
3. Run with `npm run test:visual:headed` to see what's happening

### Tests failing unexpectedly

1. Check if visual changes are intentional
2. Review diff images in test reports
3. Update baselines if changes are correct: `npm run test:visual:update`

### Tests timing out

1. Increase timeout in `playwright.visual-test.config.ts`: `timeout: 60 * 1000`
2. Increase wait times in `visual-test.config.ts`

## 📝 Best Practices

1. **Commit baseline snapshots** to version control
2. **Review visual diffs** carefully before updating baselines
3. **Keep snapshots focused** - test individual components, not full pages
4. **Tag selectively** - only tag stories that need visual testing
5. **Run tests in CI** to catch visual regressions early

## 🔄 CI/CD Integration

To be implemented in Step 2 of the spike:

- Jenkins pipeline configuration
- MinIO storage for snapshots
- Automated test execution on PRs
- Visual diff reporting in pull requests

## 📚 Resources

- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots)
- [Storybook Tags](https://storybook.js.org/docs/writing-stories/tags)
- [Allure Reporting](https://docs.qameta.io/allure/)