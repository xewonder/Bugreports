// Configuration for Help Hub
export default {
  USER_ID: 'u-3f5b7f4c-418e-4d27-9a9d-733538baf577',
  PRIMARY_COLOR: '#3b82f6', // Extracted from blue-600 theme used throughout the app
  
  // Help Hub specific configurations
  HELP_CONFIG: {
    position: 'bottom-right',
    offset: {
      bottom: 20,
      right: 20
    },
    triggerText: 'Need Help?',
    welcomeMessage: 'Welcome to MGG™ Help! How can I assist you today?',
    placeholder: 'Ask me anything about MGG™...',
    categories: [
      'Getting Started',
      'Bug Reporting',
      'Feature Requests',
      'Account Management',
      'Technical Support'
    ]
  }
};