import { FullConfig } from '@playwright/test';
import logger from './logger';

async function globalTeardown(config: FullConfig) {
  logger.info('Starting global teardown for visual testing framework');
  
  // Clean up temporary files if needed
  // Add any cleanup logic here
  
  logger.info('Global teardown completed successfully');
}

export default globalTeardown;