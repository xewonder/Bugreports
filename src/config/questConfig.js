// Configuration for Quest Help Hub
export default {
  QUEST_HELP_QUESTID: 'c-greta-help-hub',
  USER_ID: 'u-4a099828-8efd-4712-a4ef-81f02acc473c',
  APIKEY: 'k-d416516b-2413-4786-bc12-7426c5a74b4c',
  TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1LTRhMDk5ODI4LThlZmQtNDcxMi1hNGVmLTgxZjAyYWNjNDczYyIsImlhdCI6MTc1NDA0NzExNCwiZXhwIjoxNzU2NjM5MTE0fQ.Am_8dikWWZ-qkxVAgAqnhxdoBriyGFlYphIYsh58oSg',
  ENTITYID: 'e-33936698-671f-4e73-bd60-783fff72cc9e',
  PRIMARY_COLOR: '#3b82f6', // Extracted blue-600 theme from your app

  // Help Hub specific configurations
  HELP_CONFIG: {
    position: 'bottom-right',
    offset: {
      bottom: 24,
      right: 24
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