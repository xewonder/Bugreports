import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import supabase from '../lib/supabase';
import SafeIcon from '../common/SafeIcon';
import UserManagement from './UserManagement';
import SystemSettings from './SystemSettings';
import DataManagement from './DataManagement';
import * as FiIcons from 'react-icons/fi';

const { FiUsers, FiSettings, FiDatabase, FiMail, FiServer } = FiIcons;

const AdminPanel = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: '587',
    smtpUsername: '',
    smtpPassword: '',
    fromEmail: 'notifications@mgg.com'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Check if user is admin
    if (!isAdmin()) {
      // Redirect or show error
      setMessage({
        type: 'error',
        text: 'You do not have permission to access this page.'
      });
    }
  }, [isAdmin]);

  const fetchEmailSettings = async () => {
    try {
      // In a production environment, you would fetch these from a secure storage
      // For this demo, we'll just show placeholder values
      setEmailSettings({
        smtpHost: 'smtp.example.com',
        smtpPort: '587',
        smtpUsername: 'your-email@example.com',
        smtpPassword: '••••••••••',
        fromEmail: 'notifications@mgg.com'
      });
    } catch (error) {
      console.error('Error fetching email settings:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'email') {
      fetchEmailSettings();
    }
  }, [activeTab]);

  const handleSaveEmailSettings = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // In a production environment, you would save these to a secure storage
      // For this demo, we'll just simulate a save operation
      await new Promise(resolve => setTimeout(resolve, 1000));

      setMessage({
        type: 'success',
        text: 'Email settings updated successfully!'
      });

      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('Error saving email settings:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update email settings: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const deployEmailFunction = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // In a real application, you would trigger the deployment of the Supabase Edge Function here
      // For this demo, we'll just simulate the deployment
      await new Promise(resolve => setTimeout(resolve, 2000));

      setMessage({
        type: 'success',
        text: 'Email notification function deployed successfully!'
      });

      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('Error deploying function:', error);
      setMessage({
        type: 'error',
        text: 'Failed to deploy function: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'users', label: 'User Management', icon: FiUsers },
    { id: 'system', label: 'System Settings', icon: FiSettings },
    { id: 'data', label: 'Data Management', icon: FiDatabase },
    { id: 'email', label: 'Email Settings', icon: FiMail }
  ];

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600">Manage users, system settings, and data</p>
      </motion.div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-4 flex items-center space-x-2 transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}>
              <SafeIcon icon={tab.icon} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Status message */}
      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg mb-6 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
          {message.text}
        </motion.div>
      )}

      {/* Tab content */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'system' && <SystemSettings />}
        {activeTab === 'data' && <DataManagement />}
        {activeTab === 'email' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Email Notification Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Host
                </label>
                <input
                  type="text"
                  value={emailSettings.smtpHost}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="smtp.example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Port
                </label>
                <input
                  type="text"
                  value={emailSettings.smtpPort}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="587"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Username
                </label>
                <input
                  type="text"
                  value={emailSettings.smtpUsername}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpUsername: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your-email@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Password
                </label>
                <input
                  type="password"
                  value={emailSettings.smtpPassword}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••••"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Email
                </label>
                <input
                  type="text"
                  value={emailSettings.fromEmail}
                  onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="notifications@mgg.com"
                />
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <SafeIcon icon={FiServer} className="h-5 w-5 text-blue-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Supabase Edge Function</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Email notifications are sent using a Supabase Edge Function. After updating your SMTP settings,
                      you need to deploy the function with the new configuration.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleSaveEmailSettings}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors">
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
              
              <button
                onClick={deployEmailFunction}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors flex items-center space-x-2">
                <SafeIcon icon={FiServer} />
                <span>{loading ? 'Deploying...' : 'Deploy Function'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;