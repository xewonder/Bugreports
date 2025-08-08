import React from 'react';
import { useMention } from '../contexts/MentionContext';
import MentionsTextarea from './MentionsTextarea';

/**
 * A component that displays mentions in a user-friendly way while using MentionsTextarea
 * for input.
 * 
 * This component wraps MentionsTextarea and transforms the display format of mentions
 * from @[username](userId) to @username
 * 
 * @param {Object} props - Component props
 * @param {string} props.value - The current value of the textarea
 * @param {function} props.onChange - Function to handle value changes
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether the textarea is disabled
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.minRows - Minimum number of rows
 * @param {number} props.maxRows - Maximum number of rows
 * @returns {JSX.Element}
 */
const DisplayMentionsTextarea = ({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  minRows,
  maxRows,
  style,
  ...props
}) => {
  const { renderWithMentions } = useMention();
  
  // Transform the display value (what the user sees)
  // This ensures the user sees @username instead of @[username](userId)
  const displayValue = value ? value.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1') : '';
  
  // Handle changes in the textarea
  const handleChange = (e) => {
    // When user types, we need to pass the event to the parent component
    onChange(e);
  };

  return (
    <MentionsTextarea
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      minRows={minRows}
      maxRows={maxRows}
      style={style}
      {...props}
    />
  );
};

export default DisplayMentionsTextarea;