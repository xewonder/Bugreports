import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import { FiUser } from 'react-icons/fi';
import { useMention } from '../contexts/MentionContext';

/**
 * Component to display mention suggestions when typing @
 */
const MentionSuggestions = ({ textAreaRef, onValueChange = null }) => {
  const {
    mentionSuggestions,
    showSuggestions,
    mentionPosition,
    selectedIndex,
    setSelectedIndex,
    setShowSuggestions,
    currentMentionStartIndex,
    setCurrentMentionStartIndex
  } = useMention();
  
  const suggestionsRef = useRef(null);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showSuggestions || mentionSuggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % mentionSuggestions.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + mentionSuggestions.length) % mentionSuggestions.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (mentionSuggestions[selectedIndex]) {
            handleUserSelection(mentionSuggestions[selectedIndex]);
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
              handleUserSelection(mentionSuggestions[selectedIndex]);
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
  }, [showSuggestions, mentionSuggestions, selectedIndex, setSelectedIndex, setShowSuggestions]);

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

  // Handle user selection (both click and keyboard)
  const handleUserSelection = (user) => {
    console.log('🎯 User selected:', user);
    
    if (!textAreaRef?.current) {
      console.error('❌ No textarea reference available');
      return;
    }

    try {
      console.log('🔧 insertMention called with:', {
        user: user.nickname || user.full_name,
        hasTextAreaRef: !!textAreaRef?.current,
        hasOnValueChange: typeof onValueChange === 'function'
      });

      const textarea = textAreaRef.current;
      const text = textarea.value;
      const cursorPosition = textarea.selectionStart;

      // Find the @ symbol that started this mention
      const lastAtIndex = currentMentionStartIndex;
      
      if (lastAtIndex === -1) {
        console.error("❌ No valid mention start position found");
        return;
      }

      console.log('📝 Current text:', text);
      console.log('📍 Cursor position:', cursorPosition);
      console.log('🎯 Last @ index:', lastAtIndex);

      // Replace @query with @[username](userId)
      const beforeMention = text.substring(0, lastAtIndex);
      const afterMention = text.substring(cursorPosition);
      const displayName = user.nickname || user.full_name;
      const mentionText = `@[${displayName}](${user.id})`;
      const newText = `${beforeMention}${mentionText} ${afterMention}`;

      console.log('🔄 New text:', newText);
      
      // Most important part: directly call the parent's onValueChange with the new text
      if (onValueChange && typeof onValueChange === 'function') {
        onValueChange(newText);

        // Place cursor after the inserted mention once the value updates
        const newCursorPosition = lastAtIndex + mentionText.length + 1;
        setTimeout(() => {
          textarea.selectionStart = newCursorPosition;
          textarea.selectionEnd = newCursorPosition;
          textarea.focus();
        }, 0);
      } else {
        // Fallback to manually updating the textarea value
        textarea.value = newText;

        // Create and dispatch an input event to trigger React's onChange
        const inputEvent = new Event('input', { bubbles: true });
        textarea.dispatchEvent(inputEvent);

        // Create a synthetic event for React's onChange
        const syntheticEvent = {
          target: { value: newText },
          preventDefault: () => {},
          stopPropagation: () => {}
        };

        // Force React to detect the change if using its internal value tracker
        if (textarea._valueTracker) {
          textarea._valueTracker.setValue('');
        }

        // Set cursor position after the inserted mention
        const newCursorPosition = lastAtIndex + mentionText.length + 1;
        setTimeout(() => {
          textarea.selectionStart = newCursorPosition;
          textarea.selectionEnd = newCursorPosition;
          textarea.focus();
        }, 0);
      }

      // Reset mention state and hide suggestions
      setShowSuggestions(false);
      setCurrentMentionStartIndex(-1);
      console.log('✅ Mention inserted successfully');
    } catch (error) {
      console.error('❌ Error inserting mention:', error);
    }
  };

  // Handle mouse down to prevent blur
  const handleMouseDown = (e, user) => {
    console.log('🖱️ Mouse down on user:', user.nickname || user.full_name);
    e.preventDefault(); // Prevent textarea from losing focus
  };

  // Handle click
  const handleClick = (e, user) => {
    console.log('🖱️ Click on user:', user.nickname || user.full_name);
    e.preventDefault();
    e.stopPropagation();
    handleUserSelection(user);
  };

  if (!showSuggestions || mentionSuggestions.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.15 }}
        ref={suggestionsRef}
        className="fixed bg-white rounded-lg shadow-xl border border-gray-200 w-64 max-h-60 overflow-y-auto z-[99999]"
        style={{
          top: `${mentionPosition.top}px`,
          left: `${mentionPosition.left}px`,
          position: 'fixed',
          zIndex: 99999
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
              onMouseDown={(e) => handleMouseDown(e, user)}
              onClick={(e) => handleClick(e, user)}
              onMouseEnter={() => setSelectedIndex(index)}
              style={{ pointerEvents: 'auto' }}
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
      </motion.div>
    </AnimatePresence>
  );
};

export default MentionSuggestions;