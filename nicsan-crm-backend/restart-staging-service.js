const { execSync } = require('child_process');

console.log('🔄 Restarting staging ECS service to pick up new environment variables...\n');

try {
  // Force new deployment to pick up updated environment variables
  const command = `aws ecs update-service --cluster nicsan-backend-cluster --service nicsan-backend-svc --force-new-deployment --region ap-south-1`;
  
  console.log('Running command:', command);
  const output = execSync(command, { encoding: 'utf8' });
  console.log('✅ Service restart initiated successfully!');
  console.log('Output:', output);
  
  console.log('\n⏳ Waiting for deployment to complete...');
  const waitCommand = `aws ecs wait services-stable --cluster nicsan-backend-cluster --services nicsan-backend-svc --region ap-south-1`;
  execSync(waitCommand, { encoding: 'utf8' });
  console.log('✅ Deployment completed successfully!');
  
} catch (error) {
  console.error('❌ Failed to restart service:', error.message);
  console.log('\n💡 Manual steps:');
  console.log('1. Go to AWS ECS Console');
  console.log('2. Find the nicsan-backend-svc service');
  console.log('3. Click "Update service"');
  console.log('4. Check "Force new deployment"');
  console.log('5. Click "Update"');
}
