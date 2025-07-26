import React from 'react';
import { format } from 'date-fns';
import SafeIcon from '../common/SafeIcon';
import { FiTrash2, FiEdit3 } from 'react-icons/fi';
import AttachmentViewer from './AttachmentViewer';
import { useMention } from '../contexts/MentionContext';

/**
 * A reusable component to display comments with mentions
 * @param {Object} props
 * @param {Object} props.comment - The comment data
 * @param {boolean} props.canDelete - Whether the user can delete the comment
 * @param {boolean} props.canEdit - Whether the user can edit the comment
 * @param {function} props.onDelete - Function to handle comment deletion
 * @param {function} props.onEdit - Function to handle comment editing
 * @returns {JSX.Element}
 */
const CommentDisplay = ({ comment, canDelete = false, canEdit = false, onDelete, onEdit }) => {
  const { renderWithMentions } = useMention();
  
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'text-red-600';
      case 'developer': return 'text-blue-600';
      case 'user': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getDisplayName = (comment) => {
    if (comment.user_nickname && typeof comment.user_nickname === 'string' && comment.user_nickname.trim() !== '') {
      return comment.user_nickname;
    }
    if (comment.user_full_name && typeof comment.user_full_name === 'string' && comment.user_full_name.trim() !== '') {
      return comment.user_full_name;
    }
    return 'Anonymous';
  };

  const displayName = getDisplayName(comment);

  return (
    <div className="flex space-x-3 pb-4 mb-4 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
        <span className="text-sm font-medium text-gray-700">
          {displayName[0]}
        </span>
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900">
              {displayName}
            </span>
            <span className={`text-xs ${getRoleColor(comment.user_role)}`}>
              {comment.user_role}
            </span>
            <span className="text-xs text-gray-500">
              {format(new Date(comment.created_at), 'MMM dd, yyyy HH:mm')}
              {comment.updated_at && comment.updated_at !== comment.created_at && ' (edited)'}
            </span>
          </div>
          {(canDelete || canEdit) && (
            <div className="flex space-x-2">
              {canEdit && (
                <button
                  onClick={() => onEdit(comment)}
                  className="text-gray-400 hover:text-blue-600"
                >
                  <SafeIcon icon={FiEdit3} className="text-sm" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onDelete(comment)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <SafeIcon icon={FiTrash2} className="text-sm" />
                </button>
              )}
            </div>
          )}
        </div>
        <div className="text-sm text-gray-700 whitespace-pre-wrap">
          {renderWithMentions(comment.text)}
        </div>
        {comment.attachments && comment.attachments.length > 0 && (
          <div className="mt-3">
            <AttachmentViewer files={comment.attachments} compact />
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentDisplay;