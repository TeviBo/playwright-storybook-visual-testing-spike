# 🚀 Quick Start Guide - Your Visual Testing Framework

## Your Current Setup ✅
- ✅ MinIO running on port 9001
- ✅ Credentials configured (`esteban` / `bobbiesi796`)
- ✅ Bucket: `storybook-visual-tests-screenshots`
- ✅ Stories tagged with `visual:check`

## Test Your Setup (2 minutes)

### 1. Setup Environment
```bash
# Create local .env (your credentials are already in .env.example)
cp .env.example .env
```

### 2. Run Quick Test
```bash
# Build Storybook first
npm run build-storybook

# Run demo visual tests 
npx playwright test tests/visual/demo-visual-test.spec.ts --headed
```

### 3. What You'll See

**First Run (Baseline Creation):**
- ✅ Tests pass with "Baseline created" annotations
- 📸 Screenshots uploaded to MinIO bucket `storybook-visual-tests-screenshots`
- 📝 Logs in `tests/logs/combined.log`

**Second Run (Visual Comparison):**
- 🔍 Tests download baselines from MinIO and compare
- ✅ Pass if no visual changes
- ❌ Fail if differences detected (with diff images)

### 4. View Results
```bash
# View Playwright HTML report
npm run reports:playwright

# Generate and view Allure report
npm run reports:allure
```

## Your Button Stories are Ready!

Your Button stories already have the `visual:check` tag:
```typescript
// In src/stories/Button.stories.ts
tags: ["autodocs", "visual:check", "story"]
```

This means the framework will automatically:
- ✅ **Include** Button Primary, Secondary, Large, Small 
- ✅ **Test** them visually across browsers
- ✅ **Store baselines** in your MinIO instance
- ✅ **Generate reports** with visual diffs

## Jenkins Integration

Your Jenkinsfile is configured for your MinIO setup. Just add these credentials in Jenkins:
- `minio-creds`: Username/Password credential with your MinIO access
- `MINIO_ENDPOINT`: String credential with your MinIO server address

## Understanding Visual Testing

**What happens during testing:**

1. **Story Discovery**: Framework reads `storybook-static/stories.json`
2. **Filtering**: Only stories with `visual:check` tag are tested
3. **Screenshot**: Each story is captured consistently across browsers
4. **Storage**: Baselines stored in MinIO at keys like `baselines/win32/chromium/Example_Button__Primary.png`
5. **Comparison**: Pixel-by-pixel diff with configurable thresholds
6. **Reporting**: Visual diffs shown in Allure reports

## Next Steps

1. **Run the test** to see your Button components get visually tested
2. **Check MinIO** to see baseline screenshots uploaded
3. **Modify a Button** and re-run to see visual diff detection
4. **Add more stories** with `visual:check` tag to expand coverage

## Troubleshooting

If tests fail to connect to MinIO, verify:
- MinIO is running on port 9001
- Credentials `esteban/bobbiesi796` are correct  
- Bucket `storybook-visual-tests-screenshots` exists (framework creates it automatically)

Ready to test? Run: `npm run build-storybook && npx playwright test tests/visual/demo-visual-test.spec.ts` 🎯