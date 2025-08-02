import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiDatabase, FiDownload, FiUpload, FiTrash2, FiRefreshCw, FiCheckCircle, FiAlertCircle, FiBarChart3 } = FiIcons;

const DataManagement = () => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });

  const dataStats = {
    bugs: 45,
    features: 23,
    users: 12,
    comments: 156,
    attachments: 34
  };

  const handleExportData = async (type) => {
    setLoading(true);
    try {
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setStatusMessage({
        type: 'success',
        message: `${type} data exported successfully`
      });

      setTimeout(() => {
        setStatusMessage({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: `Failed to export ${type} data`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setStatusMessage({
        type: 'success',
        message: 'Database backup created successfully'
      });

      setTimeout(() => {
        setStatusMessage({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: 'Failed to create backup'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Message */}
      {statusMessage.message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg flex items-center space-x-2 ${
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
        </motion.div>
      )}

      {/* Data Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <SafeIcon icon={FiBarChart3} className="mr-2 text-blue-600" />
          Data Statistics
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(dataStats).map(([key, value]) => (
            <div key={key} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-sm text-gray-600 capitalize">{key}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Data Export */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <SafeIcon icon={FiDownload} className="mr-2 text-blue-600" />
          Data Export
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {['Bugs', 'Features', 'Users', 'Comments', 'All Data'].map((type) => (
            <button
              key={type}
              onClick={() => handleExportData(type)}
              disabled={loading}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{type}</h4>
                <SafeIcon icon={FiDownload} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-600">Export {type.toLowerCase()} data as CSV</p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Database Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <SafeIcon icon={FiDatabase} className="mr-2 text-blue-600" />
          Database Management
        </h3>
        
        <div className="space-y-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Create Backup</h4>
              <button
                onClick={handleBackup}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                {loading ? (
                  <SafeIcon icon={FiRefreshCw} className="animate-spin" />
                ) : (
                  <SafeIcon icon={FiDatabase} />
                )}
                <span>Backup Now</span>
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Create a complete backup of all system data
            </p>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Import Data</h4>
              <button
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <SafeIcon icon={FiUpload} />
                <span>Import</span>
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Import data from CSV or JSON files
            </p>
          </div>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500"
      >
        <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
          <SafeIcon icon={FiTrash2} className="mr-2 text-red-600" />
          Danger Zone
        </h3>
        
        <div className="space-y-4">
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-red-900">Clear All Data</h4>
              <button
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <SafeIcon icon={FiTrash2} />
                <span>Clear Data</span>
              </button>
            </div>
            <p className="text-sm text-red-700">
              ⚠️ This will permanently delete all bugs, features, comments, and user data. This action cannot be undone.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DataManagement;