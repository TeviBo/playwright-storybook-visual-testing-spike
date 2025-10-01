# 🎯 Visual Testing Demo Guide

## Quick Start (5-minute demo)

### 1. Setup Environment
```bash
# Copy environment configuration
cp .env.example .env

# The default settings work for demo (using MinIO locally)
```

### 2. Start MinIO (local storage)
```bash
# Option A: Using Docker (recommended)
docker run -d \
  --name minio-demo \
  -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"

# Option B: Skip storage demo (tests will still work, just won't persist baselines)
# Just comment out storage operations in the test if needed
```

### 3. Run Visual Tests
```bash
# Build Storybook and run demo tests
npm run build-storybook
npm run visual-tests:local

# Or run the simplified demo
npx playwright test tests/visual/demo-visual-test.spec.ts
```

### 4. View Results
```bash
# View Playwright report
npm run reports:playwright

# View Allure report (if tests ran)
npm run reports:allure
```

## 📊 What You'll See

### First Run (Baseline Creation)
- ✅ Tests pass with "Baseline created" annotations
- 📸 Screenshots uploaded to MinIO/S3 as golden references
- 📝 Detailed logs in `tests/logs/combined.log`

### Second Run (Visual Comparison)  
- 🔍 Tests compare against baselines
- ✅ Pass if no visual changes detected
- ❌ Fail if visual differences found (with diff images)

### Test Results Include:
1. **Screenshots**: Current test screenshots
2. **Baselines**: Downloaded reference images  
3. **Diffs**: Visual difference highlights (on failures)
4. **Logs**: Detailed execution tracking
5. **Reports**: Allure report with visual galleries

## 🧪 Framework Features Demonstrated

### ✅ Story Filtering
- Automatically includes Button stories (have `visual:check` tag)
- Excludes any `*.test.stories.tsx` files
- Smart tag-based filtering

### ✅ Multi-Browser Testing
- Chromium, Firefox, WebKit support
- Consistent viewport sizes
- Mobile browser variants

### ✅ Storage Integration  
- MinIO for local development
- S3 for production/CI
- Automatic baseline management
- Version control for baselines

### ✅ Advanced Reporting
- Allure reports with visual diffs
- Playwright HTML reports
- Winston structured logging
- Jenkins integration ready

### ✅ Enterprise Features
- Configurable diff thresholds
- Baseline update workflows  
- CI/CD pipeline support
- Error handling and recovery

## 🔧 Configuration Examples

### Adjust Visual Sensitivity
```bash
# More sensitive (catch smaller changes)
VISUAL_THRESHOLD=0.1 npm run visual-tests:local

# Less sensitive (ignore minor differences)  
VISUAL_THRESHOLD=0.5 npm run visual-tests:local
```

### Update All Baselines
```bash
# When you've made intentional design changes
npm run visual-tests:update-baselines
```

### Test Specific Browser
```bash
# Test only Chrome
npx playwright test --project=chromium tests/visual/demo-visual-test.spec.ts

# Test only mobile
npx playwright test --project=mobile-chrome tests/visual/demo-visual-test.spec.ts
```

## 🚀 Next Steps

1. **Add More Stories**: Tag your stories with `visual:check`
2. **Customize Thresholds**: Adjust `VISUAL_THRESHOLD` per project needs
3. **Setup CI**: Use the provided `Jenkinsfile` 
4. **Add Mobile Tests**: Enable mobile browser testing
5. **Custom Masking**: Hide dynamic content in screenshots

## 📚 Educational Highlights

This framework demonstrates:

- **Visual Regression Testing**: Pixel-perfect UI consistency
- **Cloud Storage**: Scalable baseline management  
- **Multi-Environment**: Local dev + CI/CD support
- **Enterprise Reporting**: Professional test reporting
- **Disney-Scale**: Ready for large-scale projects

Perfect for learning visual testing concepts while having production-ready tooling! 🏰