import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import SafeIcon from '../common/SafeIcon';
import UserNotifications from './UserNotifications';
import * as FiIcons from 'react-icons/fi';

const {
  FiHome, FiBug, FiPlus, FiMap, FiUsers, FiSettings, FiMenu, FiX, FiLogOut,
  FiPackage, FiStar, FiCommand, FiMessageCircle, FiLightbulb
} = FiIcons;

const Sidebar = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const { userProfile, signOut, isAdmin } = useAuth();

  const menuItems = [
    { path: '/', icon: FiHome, label: 'Dashboard' },
    { path: '/roadmap', icon: FiMap, label: 'Roadmap' }, // Moved under Dashboard
    { path: '/bugs', icon: FiBug, label: 'Bug Reports' },
    { path: '/create-bug', icon: FiPlus, label: 'Report Bug' },
    { path: '/features', icon: FiStar, label: 'Feature Requests' },
    { path: '/prompts', icon: FiCommand, label: 'Power Prompts' },
    { path: '/tips', icon: FiLightbulb, label: 'Tips & Tricks' },
    { path: '/general-talk', icon: FiMessageCircle, label: 'General Talk' },
    { path: '/admin', icon: FiUsers, label: 'Admin Panel', adminOnly: true },
    { path: '/settings', icon: FiSettings, label: 'Settings' }
  ].filter(item => !item.adminOnly || isAdmin());

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onToggle} />
      )}

      <motion.div
        className={`fixed left-0 top-0 h-full bg-white shadow-lg z-50 transition-all duration-300 ${
          isOpen ? 'w-64' : 'w-16'
        }`}
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                <img
                  src="https://ph-files.imgix.net/c6228782-80c0-4dfe-b90a-25b9a704de70.png?auto=format"
                  alt="MGG Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  MGG<span className="text-xs align-top">™</span>
                </h1>
                <p className="text-xs text-gray-500">v1.0.0</p>
              </div>
            </motion.div>
          )}

          <div className="flex items-center space-x-1">
            {isOpen && userProfile && <UserNotifications />}
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <SafeIcon icon={isOpen ? FiX : FiMenu} className="text-gray-600 text-lg" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                location.pathname === item.path
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                  : ''
              }`}
            >
              <SafeIcon icon={item.icon} className="text-xl" />
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="ml-3 font-medium"
                >
                  {item.label}
                </motion.span>
              )}
            </Link>
          ))}
        </nav>

        {/* User info */}
        {isOpen && userProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute bottom-4 left-4 right-4"
          >
            <div className="p-3 bg-gray-50 rounded-lg mb-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {userProfile.full_name?.[0] || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {userProfile.full_name}
                  </p>
                  <p className="text-xs text-gray-600 capitalize">{userProfile.role}</p>
                </div>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <SafeIcon icon={FiLogOut} />
              <span>Sign Out</span>
            </button>
          </motion.div>
        )}
      </motion.div>
    </>
  );
};

export default Sidebar;