import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import { FiUser } from 'react-icons/fi';
import { useMention } from '../contexts/MentionContext';

/**
 * Component to display mention suggestions when typing @
 */
const MentionSuggestions = ({ textAreaRef }) => {
  const {
    mentionSuggestions,
    showSuggestions,
    mentionPosition,
    selectedIndex,
    setSelectedIndex,
    insertMention,
    setShowSuggestions
  } = useMention();
  
  const suggestionsRef = useRef(null);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showSuggestions || mentionSuggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % mentionSuggestions.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + mentionSuggestions.length) % mentionSuggestions.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (mentionSuggestions[selectedIndex]) {
            insertMention(mentionSuggestions[selectedIndex], textAreaRef);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowSuggestions(false);
          break;
        case 'Tab':
          if (showSuggestions && mentionSuggestions.length > 0) {
            e.preventDefault();
            if (mentionSuggestions[selectedIndex]) {
              insertMention(mentionSuggestions[selectedIndex], textAreaRef);
            }
          }
          break;
        default:
          break;
      }
    };

    if (showSuggestions) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSuggestions, mentionSuggestions, selectedIndex, setSelectedIndex, insertMention, textAreaRef, setShowSuggestions]);

  // Handle outside click to close suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target) &&
        textAreaRef.current &&
        !textAreaRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setShowSuggestions, textAreaRef]);

  // Debug logging
  useEffect(() => {
    if (showSuggestions) {
      console.log("🔍 MentionSuggestions - Should show:", {
        showSuggestions,
        suggestionsCount: mentionSuggestions.length,
        position: mentionPosition,
        suggestions: mentionSuggestions
      });
    }
  }, [showSuggestions, mentionSuggestions, mentionPosition]);

  if (!showSuggestions || mentionSuggestions.length === 0) {
    console.log("❌ Not showing suggestions:", { showSuggestions, count: mentionSuggestions.length });
    return null;
  }

  console.log("✅ Rendering mention suggestions:", mentionSuggestions);

  return (
    <div
      ref={suggestionsRef}
      className="fixed bg-white rounded-lg shadow-xl border border-gray-200 w-64 max-h-60 overflow-y-auto"
      style={{
        top: `${mentionPosition.top}px`,
        left: `${mentionPosition.left}px`,
        zIndex: 99999, // Very high z-index
        position: 'fixed',
        display: 'block'
      }}
    >
      <div className="p-2 bg-gray-50 border-b text-xs text-gray-600">
        Type to search users ({mentionSuggestions.length} found)
      </div>
      <ul className="py-1">
        {mentionSuggestions.map((user, index) => (
          <li
            key={user.id}
            className={`px-3 py-2 flex items-center space-x-2 cursor-pointer transition-colors ${
              index === selectedIndex
                ? 'bg-blue-50 text-blue-700'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => {
              console.log("🖱️ Clicked on user:", user);
              insertMention(user, textAreaRef);
            }}
          >
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <SafeIcon icon={FiUser} className="text-blue-600 text-xs" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.nickname || user.full_name}
              </p>
              <p className="text-xs text-gray-500 capitalize truncate">
                {user.role || 'user'}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MentionSuggestions;