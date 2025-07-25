import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import EnhancedTextarea from './EnhancedTextarea';
import MentionSuggestions from './MentionSuggestions';
import { useMention } from '../contexts/MentionContext';

/**
 * Test component for mentions functionality
 */
const TestMentions = () => {
  const [text, setText] = useState('');
  const textAreaRef = useRef(null);
  const { renderWithMentions, processMentions } = useMention();

  const handleSubmit = () => {
    console.log("Processing mentions for text:", text);
    const mentions = processMentions(text, 'test', 'test-123');
    console.log("Found mentions:", mentions);
    alert(`Found ${mentions.length} mentions! Check console for details.`);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Test Mentions Functionality
        </h2>
        
        <div className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type @ to mention users:
            </label>
            <EnhancedTextarea
              ref={textAreaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type @ followed by a username to test mentions..."
              minRows={4}
            />
            <MentionSuggestions textAreaRef={textAreaRef} />
          </div>

          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Test Process Mentions
          </button>

          {text && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Preview with rendered mentions:
              </h3>
              <div className="text-sm text-gray-900">
                {renderWithMentions(text)}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TestMentions;