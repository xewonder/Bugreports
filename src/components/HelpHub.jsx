import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiMessageCircle, FiX, FiSend, FiHelpCircle, FiBook, FiLifeBuoy, FiSearch, FiChevronRight } = FiIcons;

/**
 * Comprehensive Help Hub component with chat interface and help resources
 */
const HelpHub = () => {
  const { userProfile } = useAuth();
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([
  {
    id: 'welcome',
    type: 'bot',
    text: 'Welcome to MGG™ Help! How can I assist you today?',
    timestamp: new Date()
  }]
  );
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const messagesEndRef = useRef(null);

  // Generate unique user ID based on profile or use fallback
  const uniqueUserId = userProfile?.id || 'anonymous-user';

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Help categories and quick actions
  const helpCategories = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: FiHelpCircle,
    description: 'Learn the basics of MGG™',
    items: [
    'How to create your first bug report',
    'Understanding user roles and permissions',
    'Navigating the dashboard',
    'Setting up your profile']

  },
  {
    id: 'bug-reporting',
    title: 'Bug Reporting',
    icon: FiMessageCircle,
    description: 'Master bug reporting features',
    items: [
    'How to write effective bug reports',
    'Adding attachments and screenshots',
    'Using severity and priority levels',
    'Tracking bug status updates']

  },
  {
    id: 'features',
    title: 'Feature Requests',
    icon: FiBook,
    description: 'Request and track new features',
    items: [
    'Submitting feature requests',
    'Voting on community features',
    'Understanding the roadmap',
    'Feature status lifecycle']

  },
  {
    id: 'collaboration',
    title: 'Collaboration',
    icon: FiLifeBuoy,
    description: 'Work effectively with your team',
    items: [
    'Using @mentions in comments',
    'Participating in discussions',
    'Power prompts and tips',
    'Notification settings']

  }];


  // Quick help responses
  const quickResponses = {
    'bug report': "To create a bug report:\n1. Click 'Report Bug' in the sidebar\n2. Provide a clear title and description\n3. Set appropriate severity and priority\n4. Add screenshots if helpful\n5. Submit and track progress!",
    'feature request': "To request a feature:\n1. Go to 'Feature Requests'\n2. Click 'Request Feature'\n3. Describe your idea clearly\n4. Explain why it would be valuable\n5. Vote on existing requests too!",
    'mention': "To mention someone:\n1. Type @ followed by their name\n2. Select from the dropdown\n3. They'll get a notification\n4. Great for getting attention or asking questions!",
    'roadmap': "The roadmap shows planned features and their progress. You can:\n- View upcoming features by quarter\n- Vote on roadmap items\n- Comment with feedback\n- Track development status",
    'roles': "MGG™ has three user roles:\n- User: Can report bugs and request features\n- Developer: Can manage bugs and roadmap\n- Admin: Full system access\nContact an admin to change your role.",
    'default': "I'm here to help! You can ask me about:\n- Creating bug reports\n- Requesting features\n- Using @mentions\n- Understanding the roadmap\n- User roles and permissions\n\nWhat would you like to know more about?"
  };

  const handleSendMessage = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Generate bot response
    setTimeout(() => {
      const lowerInput = input.toLowerCase();
      let response = quickResponses.default;

      // Check for keywords and provide specific responses
      for (const [keyword, responseText] of Object.entries(quickResponses)) {
        if (keyword !== 'default' && lowerInput.includes(keyword)) {
          response = responseText;
          break;
        }
      }

      const botMessage = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        text: response,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (action) => {
    setInput(action);
    handleSendMessage();
  };

  const toggleChat = () => {
    setShowChat(!showChat);
    if (!showChat) {
      setSelectedCategory(null);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {showChat &&
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="bg-white rounded-lg shadow-xl border border-gray-200 mb-4 flex flex-col"
          style={{ width: '380px', height: '500px' }}>

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <img
                  src="https://ph-files.imgix.net/c6228782-80c0-4dfe-b90a-25b9a704de70.png?auto=format"
                  alt="MGG Logo"
                  className="w-8 h-8 object-contain" />

                </div>
                <div>
                  <h3 className="font-medium">MGG™ Help Hub</h3>
                  <p className="text-xs opacity-80">How can we help you today?</p>
                </div>
              </div>
              <button
              onClick={toggleChat}
              className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded-full transition-colors">

                <SafeIcon icon={FiX} />
              </button>
            </div>

            {/* Content */}
            {selectedCategory ?
          // Category details view
          <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <button
                onClick={() => setSelectedCategory(null)}
                className="text-blue-600 hover:text-blue-800 text-sm mb-2">

                    ← Back to Help Topics
                  </button>
                  <h4 className="font-medium text-gray-900">{selectedCategory.title}</h4>
                  <p className="text-sm text-gray-600">{selectedCategory.description}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-2">
                    {selectedCategory.items.map((item, index) =>
                <button
                  key={index}
                  onClick={() => handleQuickAction(item)}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors">

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{item}</span>
                          <SafeIcon icon={FiChevronRight} className="text-gray-400 text-sm" />
                        </div>
                      </button>
                )}
                  </div>
                </div>
              </div> :

          // Main chat interface
          <>
                {/* Quick Help Categories */}
                <div className="p-4 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Help Topics</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {helpCategories.map((category) =>
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category)}
                  className="p-2 text-left hover:bg-blue-50 rounded-lg border border-gray-200 transition-colors">

                        <div className="flex items-center space-x-2">
                          <SafeIcon icon={category.icon} className="text-blue-600 text-sm" />
                          <span className="text-xs font-medium text-gray-700">{category.title}</span>
                        </div>
                      </button>
                )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((message) =>
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>

                      <div
                  className={`max-w-[85%] p-3 rounded-lg ${
                  message.type === 'user' ?
                  'bg-blue-600 text-white rounded-tr-none' :
                  'bg-gray-100 text-gray-800 rounded-tl-none'}`
                  }>

                        <p className="text-sm whitespace-pre-line">{message.text}</p>
                        <p className="text-xs opacity-70 text-right mt-1">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
              )}

                  {isTyping &&
              <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-800 p-3 rounded-lg rounded-tl-none max-w-[85%]">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-100"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200"></div>
                        </div>
                      </div>
                    </div>
              }
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-gray-200 p-3">
                  <div className="flex items-center space-x-2">
                    <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about MGG™..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="2" />

                    <button
                  onClick={handleSendMessage}
                  disabled={!input.trim()}
                  className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:bg-blue-400 transition-colors">

                      <SafeIcon icon={FiSend} />
                    </button>
                  </div>
                  
                  {/* Quick action buttons */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {['How to report a bug?', 'Use @mentions'].map((action) =>
                <button
                  key={action}
                  onClick={() => handleQuickAction(action)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors">

                        {action}
                      </button>
                )}
                  </div>
                </div>
              </>
          }
          </motion.div>
        }
      </AnimatePresence>

      {/* Chat toggle button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleChat}
        className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors">

        <SafeIcon icon={showChat ? FiX : FiMessageCircle} className="text-xl" />
      </motion.button>
    </div>);

};

export default HelpHub;