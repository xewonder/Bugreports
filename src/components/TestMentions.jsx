import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import EnhancedTextarea from './EnhancedTextarea';
import MentionSuggestions from './MentionSuggestions';
import { useMention } from '../contexts/MentionContext';
import SafeIcon from '../common/SafeIcon';
import { FiInfo, FiCheck, FiUsers, FiAlertCircle } from 'react-icons/fi';

/**
 * Test component for mentions functionality
 */
const TestMentions = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const textAreaRef = useRef(null);
  const {
    renderWithMentions,
    processMentions,
    users,
    loading,
    mentionsTableExists,
    showSuggestions,
    mentionSuggestions
  } = useMention();

  const handleSubmit = () => {
    console.log("Processing mentions for text:", text);
    const mentions = processMentions(text, 'test', 'test-123');
    console.log("Found mentions:", mentions);

    setResult(mentions);
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6">

        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Test Mentions Functionality
        </h2>
        
        {/* Debug Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <SafeIcon icon={FiUsers} className="text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-800">Available Users</p>
                <p className="text-lg font-bold text-blue-900">{users.length}</p>
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg ${mentionsTableExists ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center">
              <SafeIcon
                icon={mentionsTableExists ? FiCheck : FiAlertCircle}
                className={`mr-2 ${mentionsTableExists ? 'text-green-600' : 'text-red-600'}`} />

              <div>
                <p className={`text-sm font-medium ${mentionsTableExists ? 'text-green-800' : 'text-red-800'}`}>
                  Mentions Table
                </p>
                <p className={`text-lg font-bold ${mentionsTableExists ? 'text-green-900' : 'text-red-900'}`}>
                  {mentionsTableExists ? 'Ready' : 'Missing'}
                </p>
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg ${showSuggestions ? 'bg-yellow-50' : 'bg-gray-50'}`}>
            <div className="flex items-center">
              <SafeIcon
                icon={FiInfo}
                className={`mr-2 ${showSuggestions ? 'text-yellow-600' : 'text-gray-600'}`} />

              <div>
                <p className={`text-sm font-medium ${showSuggestions ? 'text-yellow-800' : 'text-gray-800'}`}>
                  Suggestions
                </p>
                <p className={`text-lg font-bold ${showSuggestions ? 'text-yellow-900' : 'text-gray-900'}`}>
                  {showSuggestions ? `${mentionSuggestions.length} shown` : 'Hidden'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
            <div className="flex">
              <SafeIcon icon={FiInfo} className="flex-shrink-0 text-blue-500 mt-0.5" />
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Type <strong>@</strong> followed by a name to test the mention functionality. 
                  When you select a user from the dropdown, it will insert a mention in the special format: <code>@[username](userId)</code>
                </p>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type @ to mention users:
            </label>
            <EnhancedTextarea
              ref={textAreaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type @ followed by a username to test mentions..."
              minRows={4} />
            <MentionSuggestions 
              textAreaRef={textAreaRef} 
              onValueChange={setText}
            />
          </div>
          
          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            Test Process Mentions
          </button>
          
          {showSuccess &&
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-50 border-l-4 border-green-500 p-4 mt-4">
              <div className="flex">
                <SafeIcon icon={FiCheck} className="flex-shrink-0 text-green-500 mt-0.5" />
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    Found {result?.length || 0} mentions! Check console for details.
                  </p>
                </div>
              </div>
            </motion.div>
          }
          
          {text &&
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Preview with rendered mentions:
              </h3>
              <div className="text-sm text-gray-900 p-3 bg-white border border-gray-200 rounded-md">
                {renderWithMentions(text)}
              </div>
            </div>
          }
          
          {/* Available Users Debug */}
          {users.length > 0 &&
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Available Users for Mentions:
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {users.slice(0, 6).map((user) =>
              <div key={user.id} className="text-xs bg-white p-2 rounded border">
                    <div className="font-medium">{user.nickname || user.full_name}</div>
                    <div className="text-gray-500">{user.role}</div>
                  </div>
              )}
                {users.length > 6 &&
              <div className="text-xs bg-white p-2 rounded border text-center text-gray-500">
                    +{users.length - 6} more
                  </div>
              }
              </div>
            </div>
          }
        </div>
      </motion.div>
    </div>);

};

export default TestMentions;