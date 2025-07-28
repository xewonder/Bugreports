import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import { FiSend } from 'react-icons/fi';
import MentionsTextarea from './MentionsTextarea';
import FileUpload from './FileUpload';

/**
 * A reusable comment form component with mentions support
 * @param {Object} props
 * @param {function} props.onSubmit - Function to handle comment submission
 * @param {boolean} props.loading - Whether the form is submitting
 * @param {Array} props.attachments - Current attachments
 * @param {function} props.setAttachments - Function to update attachments
 * @param {string} props.placeholder - Placeholder text
 * @returns {JSX.Element}
 */
const CommentForm = ({
  onSubmit,
  loading = false,
  attachments = [],
  setAttachments,
  placeholder = 'Add a comment... (Type @ to mention users)'
}) => {
  const [commentText, setCommentText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim() && attachments.length === 0) return;

    onSubmit(commentText);
    setCommentText('');
  };

  return (
    <div className="form-container space-y-3">
      <MentionsTextarea
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        placeholder={placeholder}
        disabled={loading}
        style={{ height: '90px !important' }} />

      
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
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors relative z-10">

          {loading ?
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> :

          <SafeIcon icon={FiSend} />
          }
          <span>Submit</span>
        </button>
      </div>
    </div>);

};

export default CommentForm;