import { execSync } from 'child_process';

async function globalSetup() {
  console.log('Running test:bddgen to generate BDD test files...');
  // Executes your shell script or command synchronously
  execSync('npm run test:bddgen', { stdio: 'inherit' }); 
}

export default globalSetup;