import React, { useRef, useEffect, forwardRef } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { useMention } from '../contexts/MentionContext';

/**
 * Enhanced textarea component with mention support
 */
const EnhancedTextarea = forwardRef(({
  value,
  onChange,
  placeholder = 'Type something... (Use @ to mention users)',
  minRows = 3,
  maxRows = 10,
  disabled = false,
  className = '',
  ...props
}, ref) => {
  const textAreaRef = useRef(null);
  const { handleMentionInput } = useMention();

  // Combine refs (external ref and internal ref)
  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(textAreaRef.current);
      } else {
        ref.current = textAreaRef.current;
      }
    }
  }, [ref]);

  const handleChange = (e) => {
    onChange(e);
    // Call mention handler after onChange to ensure state is updated
    setTimeout(() => {
      handleMentionInput(e, textAreaRef);
    }, 10);
  };

  const handleKeyDown = (e) => {
    // Debug logging for @ key press
    if (e.key === '@') {
      console.log("@ key pressed in enhanced textarea", {
        cursorPos: textAreaRef.current?.selectionStart,
        textValue: textAreaRef.current?.value
      });
    }

    // Pass the keydown event to parent if needed
    if (props.onKeyDown) {
      props.onKeyDown(e);
    }
  };

  const handleInput = (e) => {
    // Handle input event for better @ detection
    setTimeout(() => {
      handleMentionInput(e, textAreaRef);
    }, 10);
  };

  const handleKeyUp = (e) => {
    // Also handle keyup for @ detection
    if (e.key === '@' || e.key === 'Backspace' || e.key === 'Delete') {
      setTimeout(() => {
        handleMentionInput(e, textAreaRef);
      }, 10);
    }
  };

  return (
    <div className="relative">
      <TextareaAutosize
        ref={textAreaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onInput={handleInput}
        placeholder={placeholder}
        minRows={minRows}
        maxRows={maxRows}
        disabled={disabled}
        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${className}`}
        {...props}
      />
    </div>
  );
});

EnhancedTextarea.displayName = 'EnhancedTextarea';

export default EnhancedTextarea;