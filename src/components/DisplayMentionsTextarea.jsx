import React, { useState, useEffect, useMemo } from 'react';
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
  const { users } = useMention();

  // Maintain the raw value with @[username](userId) tokens
  const [rawValue, setRawValue] = useState(value || '');

  // Keep rawValue in sync with external value changes
  useEffect(() => {
    setRawValue(value || '');
  }, [value]);

  // Map of display names to user IDs for reconstructing raw value
  const nameIdMap = useMemo(() => {
    const map = {};
    users.forEach((user) => {
      const displayName = user.nickname || user.full_name;
      if (displayName) {
        map[displayName] = user.id;
      }
    });
    return map;
  }, [users]);

  // Transform the display value (what the user sees)
  // This ensures the user sees @username instead of @[username](userId)
  const displayValue = rawValue
    ? rawValue.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1')
    : '';

  // Handle changes in the textarea
  const handleChange = (e) => {
    const inputValue = e.target.value;

    // Convert display mentions back to raw format using the name → ID map
    const newRawValue = inputValue.replace(/@([\w.-]+)/g, (match, name) => {
      const id = nameIdMap[name];
      return id ? `@[${name}](${id})` : match;
    });

    setRawValue(newRawValue);

    // Pass the reconstructed raw value to the parent
    if (onChange) {
      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: newRawValue }
      };
      onChange(syntheticEvent);
    }
  };

  return (
    <MentionsTextarea
      value={displayValue}
      rawValue={rawValue}
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