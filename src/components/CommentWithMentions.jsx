import React from 'react';
import { useMention } from '../contexts/MentionContext';

/**
 * CommentWithMentions component renders text content with proper formatting for mentions
 * 
 * This component processes the text content and replaces any @[username](userId) format
 * with a proper UserMention component.
 * 
 * @param {Object} props
 * @param {string} props.content - Text content that may contain mentions
 * @param {string} props.className - Additional CSS classes for the wrapper
 * @param {number} props.maxLength - Optional maximum length for content (will add "..." if truncated)
 * @param {Object} props.style - Optional inline styles for the wrapper
 * @returns {JSX.Element}
 */
const CommentWithMentions = ({ content, className = '', maxLength, style = {} }) => {
  const { renderWithMentions } = useMention();
  
  if (!content) return null;
  
  // Handle truncation if maxLength is specified
  let displayContent = content;
  let isTruncated = false;
  
  if (maxLength && content.length > maxLength) {
    displayContent = content.substring(0, maxLength);
    isTruncated = true;
  }
  
  return (
    <div className={className} style={style}>
      {renderWithMentions(displayContent)}
      {isTruncated && '...'}
    </div>
  );
};

export default CommentWithMentions;