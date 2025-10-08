import React, { useState } from 'react';
import { Settings, Users, Lock, BarChart3, UserPlus } from 'lucide-react';
import BusinessSettings from '../../../components/Settings/BusinessSettings';
import TelecallerManagement from '../../../components/Settings/TelecallerManagement';
import FoundersPasswordManagement from '../../../components/PasswordChange/FoundersPasswordManagement';
import UserManagement from '../../../components/Settings/UserManagement';

type SettingsTab = 'business' | 'telecallers' | 'passwords' | 'users';

const PageFounderSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('business');

  const tabs = [
    {
      id: 'business' as SettingsTab,
      label: 'Business Settings',
      icon: BarChart3
    },
    {
      id: 'telecallers' as SettingsTab,
      label: 'Telecaller Management',
      icon: Users
    },
    {
      id: 'passwords' as SettingsTab,
      label: 'Password Management',
      icon: Lock
    },
    {
      id: 'users' as SettingsTab,
      label: 'User Management',
      icon: UserPlus
    }
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'business':
        return <BusinessSettings />;
      case 'telecallers':
        return <TelecallerManagement />;
      case 'passwords':
        return <FoundersPasswordManagement />;
      case 'users':
        return <UserManagement />;
      default:
        return <BusinessSettings />;
      }
    };
  
    return (
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <Settings className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Founder Settings</h1>
            <p className="text-sm text-gray-600">Manage business settings, users, and system configuration</p>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-1">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
          <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
          </button>
              );
            })}
            </div>
          </div>
          
        {/* Tab Content */}
        <div className="min-h-[400px]">
          {renderActiveTab()}
                    </div>
                  </div>
    );
  };

export default PageFounderSettings;