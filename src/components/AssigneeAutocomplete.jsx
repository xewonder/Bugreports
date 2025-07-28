import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import supabase from '../lib/supabase';

const { FiUser, FiChevronDown, FiLoader } = FiIcons;

/**
 * Autocomplete component for selecting assignees from admins and developers
 * @param {Object} props
 * @param {string} props.value - Current assignee value
 * @param {function} props.onChange - Function to handle value change
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether the input is disabled
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
const AssigneeAutocomplete = ({
  value = '',
  onChange,
  placeholder = 'Person responsible',
  disabled = false,
  className = '',
  ...props
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Fetch admins and developers when component mounts
  useEffect(() => {
    fetchAssigneeSuggestions();
  }, []);

  // Update input value when value prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle outside click to close suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
      suggestionsRef.current &&
      !suggestionsRef.current.contains(e.target) &&
      inputRef.current &&
      !inputRef.current.contains(e.target))
      {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchAssigneeSuggestions = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.
      from('profiles_mgg_2024').
      select('id, full_name, nickname, role').
      in('role', ['admin', 'developer']).
      eq('is_active', true);

      if (error) throw error;

      setSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching assignee suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSuggestions = (query) => {
    if (!query) return suggestions;

    const lowerQuery = query.toLowerCase().trim();
    return suggestions.filter((user) => {
      const fullName = (user.full_name || '').toLowerCase();
      const nickname = (user.nickname || '').toLowerCase();
      return fullName.includes(lowerQuery) || nickname.includes(lowerQuery);
    });
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Only call onChange if explicitly provided
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (suggestion) => {
    const displayName = suggestion.nickname || suggestion.full_name || '';
    setInputValue(displayName);

    // Only call onChange if explicitly provided
    if (onChange) {
      onChange(displayName);
    }

    setShowSuggestions(false);
  };

  // Get filtered suggestions based on current input
  const filteredSuggestions = filterSuggestions(inputValue);

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
          {...props} />

        <button
          type="button"
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          disabled={disabled}>

          <SafeIcon icon={FiChevronDown} />
        </button>
      </div>
      
      <AnimatePresence>
        {showSuggestions &&
        <motion.div
          ref={suggestionsRef}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">

            {loading ?
          <div className="flex items-center justify-center p-4">
                <SafeIcon icon={FiLoader} className="animate-spin mr-2" />
                <span className="text-sm text-gray-500">Loading...</span>
              </div> :
          filteredSuggestions.length > 0 ?
          <ul className="py-1">
                {filteredSuggestions.map((suggestion) =>
            <li
              key={suggestion.id}
              onClick={() => handleSelectSuggestion(suggestion)}
              className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center space-x-2">

                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <SafeIcon icon={FiUser} className="text-blue-600 text-xs" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.nickname || suggestion.full_name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize truncate">
                        {suggestion.role || 'user'}
                      </p>
                    </div>
                  </li>
            )}
              </ul> :

          <div className="p-4 text-center text-sm text-gray-500">
                No assignees found
              </div>
          }
          </motion.div>
        }
      </AnimatePresence>
    </div>);

};

export default AssigneeAutocomplete;