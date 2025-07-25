import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const {
  FiUser,
  FiMail,
  FiSettings,
  FiBell,
  FiGlobe,
  FiLock,
  FiEye,
  FiSave,
  FiAlertCircle,
  FiCheckCircle,
  FiX
} = FiIcons;

const Settings = () => {
  const { userProfile, updateUserProfile } = useAuth();
  const [settings, setSettings] = useState({
    profile: {
      name: '',
      email: '',
      nickname: '',
      role: '',
      avatar: ''
    },
    notifications: {
      email: true,
      push: false,
      bugUpdates: true,
      comments: true,
      roadmapChanges: true,
      systemAnnouncements: true
    },
    preferences: {
      theme: 'system',
      language: 'en',
      compactView: false,
      autoRefresh: true
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30
    }
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });

  // Initialize settings with actual user profile data
  useEffect(() => {
    if (userProfile) {
      setSettings(prev => ({
        ...prev,
        profile: {
          name: userProfile.full_name || '',
          email: userProfile.email || '',
          nickname: userProfile.nickname || '',
          role: userProfile.role || 'User',
          avatar: ''
        }
      }));
    }
  }, [userProfile]);

  const updateProfile = (field, value) => {
    setSettings({
      ...settings,
      profile: {
        ...settings.profile,
        [field]: value
      }
    });
  };

  const updateNotifications = (field, value) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [field]: value
      }
    });
  };

  const updatePreferences = (field, value) => {
    setSettings({
      ...settings,
      preferences: {
        ...settings.preferences,
        [field]: value
      }
    });
  };

  const updateSecurity = (field, value) => {
    setSettings({
      ...settings,
      security: {
        ...settings.security,
        [field]: value
      }
    });
  };

  const handleSave = async () => {
    if (!userProfile) {
      setStatusMessage({ type: 'error', message: 'No user profile found' });
      return;
    }

    setLoading(true);
    setStatusMessage({ type: '', message: '' });

    try {
      // Update profile in Supabase - include both full_name and nickname
      const result = await updateUserProfile(userProfile.id, {
        full_name: settings.profile.name.trim(),
        nickname: settings.profile.nickname.trim()
      });

      if (result.error) {
        throw new Error(result.error.message || 'Failed to update profile');
      }

      setSaved(true);
      setStatusMessage({ type: 'success', message: 'Settings saved successfully!' });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaved(false);
        setStatusMessage({ type: '', message: '' });
      }, 3000);

    } catch (error) {
      console.error("Error updating profile:", error);
      setStatusMessage({ 
        type: 'error', 
        message: 'Failed to save settings: ' + (error.message || 'Unknown error')
      });
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account preferences</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <SafeIcon icon={FiSave} />
            )}
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </motion.div>

      {/* Status Messages */}
      {statusMessage.message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg mb-6 flex items-center space-x-2 ${
            statusMessage.type === 'success' 
              ? 'bg-green-50 text-green-700' 
              : 'bg-red-50 text-red-700'
          }`}
        >
          <SafeIcon 
            icon={statusMessage.type === 'success' ? FiCheckCircle : FiAlertCircle} 
            className="flex-shrink-0" 
          />
          <span>{statusMessage.message}</span>
          <button
            onClick={() => setStatusMessage({ type: '', message: '' })}
            className="ml-auto text-gray-500 hover:text-gray-700"
          >
            <SafeIcon icon={FiX} />
          </button>
        </motion.div>
      )}

      {/* Success Message (Alternative display) */}
      {saved && !statusMessage.message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 text-green-800 p-4 rounded-lg mb-6 flex items-center space-x-2"
        >
          <SafeIcon icon={FiCheckCircle} className="text-green-500" />
          <span>Settings saved successfully!</span>
          <button
            onClick={() => setSaved(false)}
            className="ml-auto text-green-500 hover:text-green-700"
          >
            <SafeIcon icon={FiX} />
          </button>
        </motion.div>
      )}

      <div className="max-w-4xl space-y-8">
        {/* Profile Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <SafeIcon icon={FiUser} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={settings.profile.name}
                onChange={(e) => updateProfile('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>
            {/* Nickname Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={settings.profile.nickname}
                onChange={(e) => updateProfile('nickname', e.target.value)}
                placeholder="Choose a display name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be displayed in comments and posts
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={settings.profile.email}
                onChange={(e) => updateProfile('email', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Email address cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <input
                type="text"
                value={settings.profile.role}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Contact admin to change your role</p>
            </div>
          </div>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <SafeIcon icon={FiBell} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Email Notifications</h3>
                <p className="text-xs text-gray-500">Receive email updates about your activity</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.email}
                  onChange={(e) => updateNotifications('email', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Bug Updates</h3>
                <p className="text-xs text-gray-500">Notifications about changes to bugs you're involved with</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.bugUpdates}
                  onChange={(e) => updateNotifications('bugUpdates', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Comment Notifications</h3>
                <p className="text-xs text-gray-500">Notifications when someone comments on your bugs or replies to you</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.comments}
                  onChange={(e) => updateNotifications('comments', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Roadmap Changes</h3>
                <p className="text-xs text-gray-500">Notifications about updates to the roadmap</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.roadmapChanges}
                  onChange={(e) => updateNotifications('roadmapChanges', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </motion.div>

        {/* Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <SafeIcon icon={FiSettings} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">App Preferences</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <select
                value={settings.preferences.theme}
                onChange={(e) => updatePreferences('theme', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System Default</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={settings.preferences.language}
                onChange={(e) => updatePreferences('language', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Compact View</h3>
                <p className="text-xs text-gray-500">Use a more compact UI layout</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.preferences.compactView}
                  onChange={(e) => updatePreferences('compactView', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Auto Refresh</h3>
                <p className="text-xs text-gray-500">Automatically refresh data</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.preferences.autoRefresh}
                  onChange={(e) => updatePreferences('autoRefresh', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <SafeIcon icon={FiLock} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Security</h2>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Two-Factor Authentication</h3>
                <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.twoFactorEnabled}
                  onChange={(e) => updateSecurity('twoFactorEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Change Password</h3>
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center space-x-2 transition-colors">
                <SafeIcon icon={FiEye} />
                <span>Reset Password</span>
              </button>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</h3>
              <input
                type="number"
                min="5"
                max="120"
                value={settings.security.sessionTimeout}
                onChange={(e) => updateSecurity('sessionTimeout', parseInt(e.target.value))}
                className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;