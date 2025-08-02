import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import SafeIcon from '../common/SafeIcon';
import UserManagement from './UserManagement';
import UserRoleManagement from './UserRoleManagement';
import SystemSettings from './SystemSettings';
import DataManagement from './DataManagement';
import * as FiIcons from 'react-icons/fi';

const { FiUsers, FiSettings, FiDatabase, FiShield, FiUserCheck } = FiIcons;

const AdminPanel = () => {
  const { userProfile, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    {
      id: 'users',
      label: 'User Management',
      icon: FiUsers,
      component: UserManagement
    },
    {
      id: 'roles',
      label: 'Role Management',
      icon: FiUserCheck,
      component: UserRoleManagement
    },
    {
      id: 'settings',
      label: 'System Settings',
      icon: FiSettings,
      component: SystemSettings
    },
    {
      id: 'data',
      label: 'Data Management',
      icon: FiDatabase,
      component: DataManagement
    }
  ];

  if (!isAdmin()) {
    return (
      <div className="p-6 text-center">
        <SafeIcon icon={FiShield} className="text-red-500 text-6xl mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600">You need administrator privileges to access this page.</p>
      </div>
    );
  }

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Manage MGG™ Software Package system and users</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-1 flex items-center space-x-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <SafeIcon icon={tab.icon} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};

export default AdminPanel;