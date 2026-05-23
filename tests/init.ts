import { execSync } from 'child_process';

/**
 * Global setup function to run before all tests.
 * This function will execute the 'test:bddgen' script to generate BDD test files before any tests are run.
 */
async function globalSetup() {
  console.log('Running test:bddgen to generate BDD test files...');
  execSync('npm run test:bddgen', { stdio: 'inherit' });
}

export default globalSetup;