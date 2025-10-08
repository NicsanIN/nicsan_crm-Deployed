const { execSync } = require('child_process');

console.log('🔧 Updating staging task definition with production database config...');

// Get current task definition
const getCurrentTaskDef = () => {
  try {
    const result = execSync('aws ecs describe-task-definition --task-definition nicsan-backend-task-staging --query "taskDefinition"', { encoding: 'utf8' });
    return JSON.parse(result);
  } catch (error) {
    console.error('❌ Error getting current task definition:', error.message);
    return null;
  }
};

// Update task definition with database config
const updateTaskDefinition = (taskDef) => {
  const containerDef = taskDef.containerDefinitions[0];
  
  // Add database environment variables
  const dbEnvVars = [
    { name: 'PGHOST', value: 'nicsan-crm-db.cdu4ium6ws7v.ap-south-1.rds.amazonaws.com' },
    { name: 'PGPORT', value: '5432' },
    { name: 'PGUSER', value: 'nicsanadmin' },
    { name: 'PGPASSWORD', valueFrom: 'arn:aws:ssm:ap-south-1:132418765186:parameter/nicsan/backend/PGPASSWORD' },
    { name: 'PGDATABASE', value: 'nicsan_crm_staging' },
    { name: 'PGSSLMODE', value: 'require' }
  ];
  
  // Add to existing environment variables
  containerDef.environment = containerDef.environment || [];
  
  // Remove existing DATABASE_URL if it exists
  containerDef.environment = containerDef.environment.filter(env => env.name !== 'DATABASE_URL');
  
  // Add new database variables
  containerDef.environment.push(...dbEnvVars);
  
  // Remove fields that shouldn't be in the new task definition
  delete taskDef.taskDefinitionArn;
  delete taskDef.revision;
  delete taskDef.status;
  delete taskDef.requiresAttributes;
  delete taskDef.placementConstraints;
  delete taskDef.compatibilities;
  delete taskDef.registeredAt;
  delete taskDef.registeredBy;
  
  return taskDef;
};

// Register new task definition
const registerNewTaskDef = (taskDef) => {
  try {
    const result = execSync(`aws ecs register-task-definition --cli-input-json '${JSON.stringify(taskDef)}'`, { encoding: 'utf8' });
    const newTaskDef = JSON.parse(result);
    console.log('✅ New task definition registered:', newTaskDef.taskDefinition.taskDefinitionArn);
    return newTaskDef.taskDefinition;
  } catch (error) {
    console.error('❌ Error registering new task definition:', error.message);
    return null;
  }
};

// Update service to use new task definition
const updateService = (taskDefArn) => {
  try {
    execSync(`aws ecs update-service --cluster nicsan-backend-cluster --service nicsan-backend-staging --task-definition ${taskDefArn}`, { encoding: 'utf8' });
    console.log('✅ Service updated with new task definition');
  } catch (error) {
    console.error('❌ Error updating service:', error.message);
  }
};

// Main execution
const main = async () => {
  console.log('📋 Getting current task definition...');
  const currentTaskDef = getCurrentTaskDef();
  
  if (!currentTaskDef) {
    console.error('❌ Failed to get current task definition');
    return;
  }
  
  console.log('🔧 Updating task definition with database config...');
  const updatedTaskDef = updateTaskDefinition(currentTaskDef);
  
  console.log('📝 Registering new task definition...');
  const newTaskDef = registerNewTaskDef(updatedTaskDef);
  
  if (!newTaskDef) {
    console.error('❌ Failed to register new task definition');
    return;
  }
  
  console.log('🚀 Updating service...');
  updateService(newTaskDef.taskDefinitionArn);
  
  console.log('✅ Staging backend will now use production database config with staging database!');
};

main();
