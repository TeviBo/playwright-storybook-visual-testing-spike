// ============================================================================
// Timing Configuration
// ============================================================================

export const TIMING_CONFIG = {
    waitAfterLoad: 500, networkIdleTimeout: 10000, selectorTimeout: 10000,
} as const;

// ============================================================================
// Storybook Configuration
// ============================================================================

export const STORYBOOK_CONFIG = {
    visualCheckTag: 'visual:check',
    rootSelector: '#storybook-root',
    baseUrl: '/',
    indexPath: '/index.json',
    iframePath: '/iframe.html',
    storyRootSelector: '#storybook-root',
    excludedSuffix: '--docs',
} as const;