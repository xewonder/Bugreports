import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiAlertCircle, FiLoader, FiRefreshCw } = FiIcons;

const ProtectedRoute = ({ children, adminOnly = false, technicianOnly = false }) => {
  const { userProfile, loading, initialized, error, isAdmin, isTechnician, retryProfileFetch } = useAuth();

  // Show loading only if not initialized yet
  if (!initialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <SafeIcon icon={FiLoader} className="text-blue-600 text-4xl animate-spin mb-4" />
        <p className="text-gray-600">Initializing authentication...</p>
        <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
      </div>
    );
  }

  // Show error if there's an auth error
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <SafeIcon icon={FiAlertCircle} className="text-red-600 text-5xl mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h1>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          {error}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={retryProfileFetch}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <SafeIcon icon={FiRefreshCw} />
            <span>Retry</span>
          </button>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Show loading if still loading after initialization
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <SafeIcon icon={FiLoader} className="text-blue-600 text-4xl animate-spin mb-4" />
        <p className="text-gray-600">Loading your profile...</p>
        <p className="text-sm text-gray-500 mt-2">Please wait a moment</p>
      </div>
    );
  }

  if (!userProfile) {
    console.log("No user profile found, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin()) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <SafeIcon icon={FiAlertCircle} className="text-red-600 text-5xl mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6 text-center">
          This area requires administrator privileges.
        </p>
        <Navigate to="/" replace />
      </div>
    );
  }

  if (technicianOnly && !isTechnician()) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <SafeIcon icon={FiAlertCircle} className="text-orange-600 text-5xl mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6 text-center">
          This area requires technician or administrator privileges.
        </p>
        <Navigate to="/" replace />
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;