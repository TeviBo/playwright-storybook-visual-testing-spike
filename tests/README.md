# Visual Testing Framework

This directory contains the comprehensive visual testing framework for the Storybook project using Playwright.

## 🏗️ Framework Architecture

```
tests/
├── config/                 # Configuration files
│   ├── logger.ts           # Winston logging setup
│   ├── global-setup.ts     # Test suite initialization
│   └── global-teardown.ts  # Test suite cleanup
├── utils/                  # Utility modules
│   ├── storage.ts          # S3/MinIO snapshot storage
│   └── storybook.ts        # Storybook interaction helpers
├── visual/                 # Visual test specifications
│   └── visual-testing.spec.ts # Main visual testing suite
├── logs/                   # Test execution logs
├── reports/                # Test reports and artifacts
│   ├── allure-results/     # Allure test results
│   ├── allure-report/      # Generated Allure HTML report
│   └── playwright-html/    # Playwright HTML report
└── snapshots/              # Local snapshot storage
```

## 🚀 How Visual Testing Works

### Overview
Visual testing compares screenshots of UI components against baseline images to detect visual regressions. Here's the workflow:

1. **Story Discovery**: Automatically finds showcase stories (excludes `*.test.stories.tsx`)
2. **Baseline Creation**: First run creates baseline screenshots stored in S3/MinIO
3. **Visual Comparison**: Subsequent runs compare new screenshots against baselines
4. **Diff Detection**: Pixel-by-pixel comparison highlights visual changes
5. **Reporting**: Results displayed in Allure reports with visual diffs

### Story Filtering Logic
- ✅ **Included**: Stories with `visual:check` or `story` tags
- ❌ **Excluded**: Stories in `*.test.stories.tsx` files or with `test` tags
- ✅ **Example**: Your Button stories are included due to `tags: ["autodocs", "visual:check", "story"]`

## 📦 Key Components

### Storage System (`tests/utils/storage.ts`)
- **S3 Integration**: Production-ready AWS S3 support
- **MinIO Support**: Local development with MinIO
- **Baseline Management**: Upload, download, and version baseline screenshots
- **Automatic Bucketing**: Organizes snapshots by platform/browser

### Storybook Integration (`tests/utils/storybook.ts`)
- **Story Discovery**: Reads from `storybook-static/stories.json`
- **Smart Filtering**: Excludes test stories, includes showcase stories
- **Navigation**: Automated story loading and screenshot capture
- **Consistency**: Standardized viewport and animation handling

### Logging System (`tests/config/logger.ts`)
- **Winston-based**: Structured JSON logging
- **Multiple Outputs**: Console, file, and error logs
- **Test Tracking**: Full audit trail of test execution
- **Performance Metrics**: Timing and resource usage

## 🛠️ Setup Instructions

### Prerequisites
1. **Node.js 18+** installed
2. **Storybook** built (`npm run build-storybook`)
3. **Storage** configured (MinIO for local, S3 for production)

### Local Development Setup

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Start MinIO** (local development):
   ```bash
   # Using Docker
   docker run -p 9000:9000 -p 9001:9001 \
     -e MINIO_ROOT_USER=minioadmin \
     -e MINIO_ROOT_PASSWORD=minioadmin \
     minio/minio server /data --console-address ":9001"
   ```

4. **Build Storybook**:
   ```bash
   npm run build-storybook
   ```

5. **Run visual tests**:
   ```bash
   npm run visual-tests:local
   ```

## 🏃‍♂️ Running Tests

### Local Development
```bash
# Run all visual tests
npm run visual-tests:local

# Run specific browser
npx playwright test --project=chromium tests/visual/visual-testing.spec.ts

# Update baselines
UPDATE_BASELINES=true npx playwright test tests/visual/visual-testing.spec.ts
```

### CI/Production
```bash
# Full CI pipeline
npm run visual-tests:ci

# The Jenkins pipeline handles this automatically
```

## 📊 Reports and Results

### Allure Reports
- **Location**: `tests/reports/allure-report/index.html`
- **Features**: Visual diffs, test history, detailed logs
- **Generation**: Automatic during test execution

### Playwright Reports
- **Location**: `tests/reports/playwright-html/index.html`
- **Features**: Test results, screenshots, traces
- **Backup**: Secondary reporting option

### Logs
- **Combined**: `tests/logs/combined.log`
- **Errors**: `tests/logs/error.log`
- **Format**: Structured JSON with timestamps

## 🔧 Configuration

### Environment Variables
| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `STORAGE_PROVIDER` | Storage backend | `minio` | `s3` |
| `STORAGE_BUCKET` | Bucket name | `visual-test-snapshots` | `my-snapshots` |
| `STORAGE_ENDPOINT` | MinIO endpoint | `localhost` | `minio.company.com` |
| `VISUAL_THRESHOLD` | Diff threshold | `0.2` | `0.1` |
| `MAX_DIFF_PIXELS` | Max diff pixels | `100` | `50` |
| `UPDATE_BASELINES` | Force baseline update | `false` | `true` |

### Browser Configuration
The framework tests across multiple browsers:
- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: Chrome Mobile, Safari Mobile
- **Viewports**: Standardized sizes for consistency

## 🐛 Troubleshooting

### Common Issues

1. **Storybook not running**:
   ```bash
   npm run storybook  # Start development server
   # OR
   npm run build-storybook  # Build static version
   ```

2. **Storage connection failed**:
   - Check MinIO is running on port 9000
   - Verify credentials in `.env`
   - Ensure bucket permissions are correct

3. **No stories found**:
   - Verify `storybook-static/stories.json` exists
   - Check story tags include `visual:check` or `story`
   - Avoid `*.test.stories.tsx` naming pattern

4. **Visual diffs failing**:
   - Check `VISUAL_THRESHOLD` setting
   - Verify consistent test environment
   - Review diff images in reports

### Debug Mode
```bash
DEBUG=pw:api npx playwright test --headed tests/visual/visual-testing.spec.ts
```

## 🚢 Jenkins Integration

The `Jenkinsfile` provides:
- **Multi-browser** parallel testing
- **Artifact archiving** of reports and screenshots
- **Slack notifications** for results
- **Environment setup** and cleanup
- **Report publishing** via Jenkins HTML publisher

### Required Jenkins Credentials
- `VISUAL_STORAGE_PROVIDER`
- `VISUAL_STORAGE_BUCKET`
- `VISUAL_STORAGE_ACCESS_KEY`
- `VISUAL_STORAGE_SECRET_KEY`
- `VISUAL_STORAGE_ENDPOINT`
- `AWS_REGION` (for S3)

## 📈 Best Practices

1. **Consistent Environment**: Same OS, browser versions across runs
2. **Stable Selectors**: Use data-testid attributes for masking
3. **Animation Control**: Disable animations during screenshot capture  
4. **Baseline Management**: Regular baseline updates for legitimate changes
5. **Threshold Tuning**: Adjust `VISUAL_THRESHOLD` based on your needs
6. **Story Tagging**: Use consistent tags for story classification

## 🔄 Workflow Integration

### Pull Request Workflow
1. **Development**: Create feature branch
2. **Visual Changes**: Update components/stories
3. **Test Locally**: Run visual tests
4. **Review Diffs**: Check visual changes are intentional
5. **Update Baselines**: If changes approved
6. **Merge**: CI validates no regressions

### Baseline Updates
```bash
# Local baseline update
UPDATE_BASELINES=true npm run visual-tests:local

# CI baseline update (via Jenkins parameter)
# Set UPDATE_BASELINES=true in Jenkins job
```

This framework provides enterprise-grade visual testing with proper storage, logging, and reporting suitable for Disney-scale projects! 🏰