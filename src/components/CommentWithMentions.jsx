import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import { FiSend } from 'react-icons/fi';
import FileUpload from './FileUpload';
import EnhancedTextarea from './EnhancedTextarea';
import MentionSuggestions from './MentionSuggestions';
import { useMention } from '../contexts/MentionContext';

/**
 * A reusable comment input component with mention functionality
 * @param {Object} props
 * @param {function} props.onSubmit - Function to handle comment submission
 * @param {boolean} props.loading - Whether the comment is being submitted
 * @param {Array} props.attachments - Current attachments
 * @param {function} props.setAttachments - Function to update attachments
 * @param {string} props.contentType - Type of content (bug, feature, etc.)
 * @param {string} props.contentId - ID of the content being commented on
 * @param {string} props.placeholder - Placeholder text for the comment input
 * @returns {JSX.Element}
 */
const CommentWithMentions = ({
  onSubmit,
  loading = false,
  attachments = [],
  setAttachments,
  contentType,
  contentId,
  placeholder = 'Add a comment... (Type @ to mention users)'
}) => {
  const [commentText, setCommentText] = useState('');
  const textAreaRef = useRef(null);
  const { processMentions } = useMention();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim() && attachments.length === 0) return;

    // Process mentions BEFORE submitting
    if (commentText.trim()) {
      console.log("Processing mentions before submit:", { commentText, contentType, contentId });
      processMentions(commentText, contentType, contentId);
    }

    onSubmit(commentText);
    setCommentText('');
  };

  return (
    <div className="form-container space-y-3 relative">
      <div className="relative">
        <EnhancedTextarea
          ref={textAreaRef}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
          className="mentions w-full" />

        <MentionSuggestions textAreaRef={textAreaRef} />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <FileUpload
          onFilesUploaded={setAttachments}
          existingFiles={attachments}
          maxFiles={2}
          disabled={loading}
          compact />

        <button
          onClick={handleSubmit}
          disabled={!commentText.trim() && attachments.length === 0 || loading}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors relative z-10">

          {loading ?
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> :
          <SafeIcon icon={FiSend} />
          }
          <span>Submit</span>
        </button>
      </div>
    </div>);

};

export default CommentWithMentions;