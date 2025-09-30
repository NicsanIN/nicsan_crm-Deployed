const { execSync } = require('child_process');

console.log('🔍 Checking staging ECS logs for email errors...\n');

try {
  // Get the latest task ARN
  console.log('📋 Getting latest task ARN...');
  const taskArn = execSync('aws ecs list-tasks --cluster nicsan-backend-cluster --service nicsan-backend-svc --region ap-south-1 --query "taskArns[0]" --output text', { encoding: 'utf8' }).trim();
  
  if (!taskArn || taskArn === 'None') {
    console.log('❌ No running tasks found');
    return;
  }
  
  console.log('✅ Found task:', taskArn);
  
  // Get logs from the last 10 minutes
  console.log('\n📧 Checking logs for email-related errors...');
  const logGroup = '/ecs/nicsan-backend-task';
  const startTime = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  
  const logCommand = `aws logs filter-log-events --log-group-name "${logGroup}" --start-time ${Math.floor(Date.now() / 1000 - 600)} --filter-pattern "email" --region ap-south-1`;
  
  try {
    const logs = execSync(logCommand, { encoding: 'utf8' });
    console.log('📧 Email-related logs:');
    console.log(logs);
  } catch (error) {
    console.log('ℹ️  No email logs found in the last 10 minutes');
  }
  
  // Check for any errors
  console.log('\n❌ Checking for errors...');
  const errorCommand = `aws logs filter-log-events --log-group-name "${logGroup}" --start-time ${Math.floor(Date.now() / 1000 - 600)} --filter-pattern "ERROR" --region ap-south-1`;
  
  try {
    const errorLogs = execSync(errorCommand, { encoding: 'utf8' });
    console.log('❌ Error logs:');
    console.log(errorLogs);
  } catch (error) {
    console.log('ℹ️  No error logs found in the last 10 minutes');
  }
  
  // Check SMTP configuration
  console.log('\n🔧 Checking SMTP configuration in logs...');
  const smtpCommand = `aws logs filter-log-events --log-group-name "${logGroup}" --start-time ${Math.floor(Date.now() / 1000 - 600)} --filter-pattern "SMTP" --region ap-south-1`;
  
  try {
    const smtpLogs = execSync(smtpCommand, { encoding: 'utf8' });
    console.log('📧 SMTP logs:');
    console.log(smtpLogs);
  } catch (error) {
    console.log('ℹ️  No SMTP logs found in the last 10 minutes');
  }
  
} catch (error) {
  console.error('❌ Failed to check logs:', error.message);
  console.log('\n💡 Manual steps:');
  console.log('1. Go to AWS CloudWatch Logs');
  console.log('2. Find log group: /ecs/nicsan-backend-task');
  console.log('3. Check recent logs for email-related errors');
}
