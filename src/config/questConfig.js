// Configuration for Quest Help Hub
export default {
  QUEST_HELP_QUESTID: 'c-greta-help-hub',
  USER_ID: 'u-3f5b7f4c-418e-4d27-9a9d-733538baf577',
  APIKEY: 'k-ed5922c8-d963-43b0-b128-9573fca7df4f',
  TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1LTNmNWI3ZjRjLTQxOGUtNGQyNy05YTlkLTczMzUzOGJhZjU3NyIsImlhdCI6MTc1MzI3NzE1OCwiZXhwIjoxNzU1ODY5MTU4fQ.kAHkwUQWQK6_u_CLbm1mqzkD9ncT94CYBPMTJ_dYVzs',
  ENTITYID: 'e-8446685f-fd1c-4131-bda3-54010e66b321',
  PRIMARY_COLOR: '#3b82f6', // Extracted blue-600 theme from the app
  
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