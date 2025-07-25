import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import { FiSend } from 'react-icons/fi';
import FileUpload from './FileUpload';
import { MentionsInput, Mention } from 'react-mentions';
import supabase from '../lib/supabase';

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
  const [users, setUsers] = useState([]);

  // Fetch users for mentions when component mounts
  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles_mgg_2024')
          .select('id, full_name, nickname, role')
          .eq('is_active', true);
        
        if (error) throw error;
        
        // Transform data for react-mentions
        const formattedUsers = data.map(user => ({
          id: user.id,
          display: user.nickname || user.full_name || 'Unknown User',
          role: user.role || 'user'
        }));
        
        setUsers(formattedUsers);
      } catch (error) {
        console.error('Error fetching users for mentions:', error);
      }
    };
    
    fetchUsers();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim() && attachments.length === 0) return;

    // Process mentions before submitting
    const mentionedUsers = extractMentionedUsers(commentText);
    if (mentionedUsers.length > 0 && contentType && contentId) {
      console.log("Mentioned users:", mentionedUsers);
      // Store mentions in the database
      storeMentions(mentionedUsers, contentType, contentId);
    }

    // Call the parent's onSubmit function
    onSubmit(commentText, contentType);
    setCommentText('');
  };

  // Extract mentioned users from text
  const extractMentionedUsers = (text) => {
    const mentionedUsers = [];
    const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const display = match[1];
      const id = match[2];
      mentionedUsers.push({ id, display });
    }
    
    return mentionedUsers;
  };

  // Store mentions in the database
  const storeMentions = async (mentionedUsers, contentType, contentId) => {
    try {
      // Check if the user_mentions_mgg2024 table exists
      const { data: tablesData, error: tablesError } = await supabase
        .from('user_mentions_mgg2024')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      const tableExists = !tablesError || tablesError.code !== '42P01';
      
      if (!tableExists) {
        console.log("Mentions table doesn't exist yet");
        return;
      }

      // Store each mention
      for (const user of mentionedUsers) {
        await supabase
          .from('user_mentions_mgg2024')
          .insert({
            mentioned_user_id: user.id,
            mentioned_by_id: localStorage.getItem('userId') || '',
            content_type: contentType,
            content_id: contentId,
            seen: false
          });
      }
    } catch (error) {
      console.error('Error storing mentions:', error);
    }
  };

  // Only enable submit when there's actual text or attachments
  const isSubmitDisabled = () => {
    return (!commentText.trim() && attachments.length === 0) || loading;
  };

  // Custom styles for react-mentions
  const mentionInputStyle = {
    control: {
      backgroundColor: '#fff',
      fontSize: 14,
      fontWeight: 'normal',
    },
    input: {
      margin: 0,
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '0.5rem',
      width: '100%',
      minHeight: '80px',
      outline: 'none',
    },
    suggestions: {
      list: {
        backgroundColor: 'white',
        border: '1px solid rgba(0,0,0,0.15)',
        borderRadius: '0.25rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        marginTop: '0.5rem',
        maxHeight: '200px',
        overflow: 'auto',
      },
      item: {
        padding: '8px 12px',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        '&focused': {
          backgroundColor: '#e0f2fe',
        },
      },
    },
  };

  return (
    <div className="space-y-3 relative">
      <div className="relative">
        <MentionsInput
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={placeholder}
          style={mentionInputStyle}
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <Mention
            trigger="@"
            data={users}
            renderSuggestion={(suggestion, search, highlightedDisplay, index, focused) => (
              <div className={`user-suggestion ${focused ? 'focused' : ''} flex items-center p-2`}>
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mr-2">
                  <span className="text-blue-600 text-xs">{suggestion.display[0]}</span>
                </div>
                <div>
                  <div className="text-sm font-medium">{suggestion.display}</div>
                  <div className="text-xs text-gray-500 capitalize">{suggestion.role}</div>
                </div>
              </div>
            )}
          />
        </MentionsInput>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <FileUpload
          onFilesUploaded={setAttachments}
          existingFiles={attachments}
          maxFiles={2}
          disabled={loading}
          compact
        />
        <button
          onClick={handleSubmit}
          disabled={isSubmitDisabled()}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <SafeIcon icon={FiSend} />
          )}
          <span>Submit</span>
        </button>
      </div>
    </div>
  );
};

export default CommentWithMentions;