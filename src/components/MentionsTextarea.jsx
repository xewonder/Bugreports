import React, { useRef } from 'react';
import EnhancedTextarea from './EnhancedTextarea';
import MentionSuggestions from './MentionSuggestions';

/**
 * A reusable textarea component with mentions support
 * @param {Object} props
 * @param {string} props.value - The current value of the textarea
 * @param {function} props.onChange - Function to handle value changes
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether the textarea is disabled
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.minRows - Minimum number of rows
 * @param {number} props.maxRows - Maximum number of rows
 * @returns {JSX.Element}
 */
const MentionsTextarea = ({
  value,
  onChange,
  placeholder = 'Add a comment... (Type @ to mention users)',
  disabled = false,
  className = '',
  minRows = 3,
  maxRows = 10,
  style = {},
  ...props
}) => {
  const textAreaRef = useRef(null);

  return (
    <div className="relative">
      <EnhancedTextarea
        ref={textAreaRef}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`mentions w-full ${className}`}
        minRows={minRows}
        maxRows={maxRows}
        style={style}
        {...props} />
      <MentionSuggestions textAreaRef={textAreaRef} />
    </div>
  );
};

export default MentionsTextarea;