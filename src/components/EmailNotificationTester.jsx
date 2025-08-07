import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../lib/supabase';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiMail, FiSend, FiCheck, FiAlertCircle, FiInfo } = FiIcons;

/**
 * A component for testing email notifications functionality
 */
const EmailNotificationTester = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Send a test email notification
  const sendTestEmail = async () => {
    if (!userProfile) {
      setResult({
        success: false,
        message: 'You must be logged in to send a test email'
      });
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      console.log('Sending test email to:', userProfile.email);

      // Prepare email payload
      const emailPayload = {
        to: userProfile.email,
        subject: 'MGG™ Test Notification',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">MGG™ Email Notification Test</h2>
            <p>This is a test email to verify that the notification system is working correctly.</p>
            <p>If you received this email, it means the email notification system is configured properly!</p>
            <div style="margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 5px;">
              <p style="margin: 0; font-weight: bold;">User Information:</p>
              <p style="margin: 5px 0 0;">Name: ${userProfile.full_name || 'N/A'}</p>
              <p style="margin: 5px 0 0;">Nickname: ${userProfile.nickname || 'N/A'}</p>
              <p style="margin: 5px 0 0;">Role: ${userProfile.role || 'User'}</p>
              <p style="margin: 5px 0 0;">Email: ${userProfile.email}</p>
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">
              This is an automated test message from MGG™ Software Package.
            </p>
          </div>
        `
      };

      // Call the serverless function
      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: emailPayload
      });

      if (error) {
        console.error('Error sending test email:', error);
        setResult({
          success: false,
          message: `Failed to send test email: ${error.message || 'Unknown error'}`
        });
      } else {
        console.log('Test email sent successfully:', data);
        setResult({
          success: true,
          message: 'Test email sent successfully! Check your inbox.'
        });
      }
    } catch (error) {
      console.error('Exception sending test email:', error);
      setResult({
        success: false,
        message: `Error: ${error.message || 'Unknown error occurred'}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-xl shadow-sm">

      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <SafeIcon icon={FiMail} className="text-blue-600 text-xl" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Email Notification Tester</h2>
      </div>

      <div className="mb-6">
        <p className="text-gray-600">
          Send a test email to verify that the notification system is working correctly.
          The email will be sent to your registered email address: <strong>{userProfile?.email || 'Not logged in'}</strong>
        </p>
      </div>

      {/* Status message */}
      {result && (
        <div className={`p-4 mb-6 rounded-lg ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <SafeIcon 
                icon={result.success ? FiCheck : FiAlertCircle} 
                className={`mt-0.5 ${result.success ? 'text-green-500' : 'text-red-500'}`} 
              />
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.success ? 'Success' : 'Error'}
              </h3>
              <div className={`mt-2 text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                <p>{result.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info box about email configuration */}
      <div className="p-4 mb-6 bg-blue-50 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <SafeIcon icon={FiInfo} className="mt-0.5 text-blue-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              About Email Notifications
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p className="mb-2">
                For email notifications to work properly, the Supabase Edge Function must be correctly configured with valid SMTP settings.
              </p>
              <p>
                If you don't receive test emails, please check the following:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>The Supabase Edge Function is deployed</li>
                <li>The SMTP configuration is correct (host, port, credentials)</li>
                <li>Email notifications are enabled in your user settings</li>
                <li>Your email provider isn't blocking the notifications</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={sendTestEmail}
          disabled={loading || !userProfile}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center space-x-2 transition-colors">
          
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <SafeIcon icon={FiSend} />
          )}
          <span>{loading ? 'Sending...' : 'Send Test Email'}</span>
        </button>
      </div>
    </motion.div>
  );
};

export default EmailNotificationTester;