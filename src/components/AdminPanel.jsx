import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import SafeIcon from '../common/SafeIcon';
import UserManagement from './UserManagement';
import * as FiIcons from 'react-icons/fi';

const { FiUsers, FiSettings, FiDatabase, FiShield } = FiIcons;

const AdminPanel = () => {
  const { userProfile, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
  { id: 'users', label: 'User Management', icon: FiUsers },
  { id: 'settings', label: 'System Settings', icon: FiSettings },
  { id: 'data', label: 'Database Management', icon: FiDatabase }];


  if (!isAdmin()) {
    return (
      <div className="p-6 text-center">
        <SafeIcon icon={FiShield} className="text-red-500 text-6xl mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600">You need administrator privileges to access this page.</p>
      </div>);

  }

  return (
    <div className="p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-8">

        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Manage MGG™ Software Package system and users</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          {tabs.map((tab) =>
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 px-1 flex items-center space-x-2 ${
            activeTab === tab.id ?
            'border-b-2 border-blue-600 text-blue-600' :
            'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
            }>

              <SafeIcon icon={tab.icon} />
              <span>{tab.label}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'users' && <UserManagement />}
        
        {activeTab === 'settings' &&
        <div className="bg-gray-50 rounded-xl p-8 text-center">
            <SafeIcon icon={FiSettings} className="text-gray-400 text-5xl mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">System Settings</h3>
            <p className="text-gray-600">
              This feature will be available in a future update.
            </p>
          </div>
        }
        
        {activeTab === 'data' &&
        <div className="bg-gray-50 rounded-xl p-8 text-center">
            <SafeIcon icon={FiDatabase} className="text-gray-400 text-5xl mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">Database Management</h3>
            <p className="text-gray-600">
              This feature will be available in a future update.
            </p>
          </div>
        }
      </div>
    </div>);

};

export default AdminPanel;