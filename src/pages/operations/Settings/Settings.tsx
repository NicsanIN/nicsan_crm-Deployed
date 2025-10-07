import React from 'react';
import { Card } from '../../../components/common/Card';
import WorkingPasswordChange from '../../../components/PasswordChange/WorkingPasswordChange';

function PageOperationsSettings() {
  return (
    <div className="space-y-6">
      <Card title="Account Settings" desc="Manage your account settings and preferences">
        <WorkingPasswordChange />
      </Card>
    </div>
  );
}

export default PageOperationsSettings;
