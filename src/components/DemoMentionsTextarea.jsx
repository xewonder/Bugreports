import React, { useState, useRef } from 'react';
import DisplayMentionsTextarea from './DisplayMentionsTextarea';
import { useMention } from '../contexts/MentionContext';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import { FiCheck, FiInfo } from 'react-icons/fi';

/**
 * Demo component for the mentions functionality
 */
const DemoMentionsTextarea = () => {
  const [text, setText] = useState('Just because it took 3500 credits and its still full of self introduced bugs!');
  const [submitted, setSubmitted] = useState(false);
  const { renderWithMentions, processMentions, users } = useMention();

  const handleSubmit = () => {
    console.log("Submitting text:", text);
    const mentions = processMentions(text, 'demo', 'demo-123');
    console.log("Processed mentions:", mentions);
    setSubmitted(true);
    
    setTimeout(() => {
      setSubmitted(false);
    }, 3000);
  };

  const handleChange = (e) => {
    setText(e.target.value);
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-3">
        User Mentions Demo
      </h3>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4">
        <div className="flex">
          <SafeIcon icon={FiInfo} className="flex-shrink-0 text-blue-500 mt-0.5" />
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Type <strong>@</strong> to mention users. Available users: {users.length > 0 ? 
                users.slice(0, 3).map(user => user.nickname || user.full_name).join(', ') + 
                (users.length > 3 ? ` and ${users.length - 3} more` : '') 
                : 'Loading...'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <DisplayMentionsTextarea
          value={text}
          onChange={handleChange}
          placeholder="What would you like to discuss? (Type @ to mention users)"
          minRows={4}
          style={{ height: '210px !important' }}
          className="w-full"
        />
        
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            Submit
          </button>
        </div>
        
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-green-50 border-l-4 border-green-500 p-3">
            <div className="flex">
              <SafeIcon icon={FiCheck} className="flex-shrink-0 text-green-500 mt-0.5" />
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  Message submitted successfully!
                </p>
              </div>
            </div>
          </motion.div>
        )}
        
        {text && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Preview with rendered mentions:
            </h4>
            <div className="text-sm text-gray-900 p-3 bg-white border border-gray-200 rounded-md">
              {renderWithMentions(text)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoMentionsTextarea;