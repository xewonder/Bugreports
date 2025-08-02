import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useMention } from '../contexts/MentionContext';
import SafeIcon from '../common/SafeIcon';
import Header from './Header';
import FileUpload from './FileUpload';
import AttachmentViewer from './AttachmentViewer';
import MentionsTextarea from './MentionsTextarea';
import DisplayMentionsTextarea from './DisplayMentionsTextarea';
import CommentWithMentions from './CommentWithMentions';
import * as FiIcons from 'react-icons/fi';
import { format } from 'date-fns';
import supabase from '../lib/supabase';

const { FiSearch, FiPlus, FiEdit3, FiTrash2, FiMessageSquare, FiThumbsUp, FiThumbsDown, FiSend, FiX, FiLoader, FiAlertCircle, FiCheckCircle, FiCommand, FiCpu, FiPaperclip } = FiIcons;

const PowerPrompts = () => {
  const { userProfile, isTechnician } = useAuth();
  const { processMentions, renderWithMentions } = useMention();

  const [prompts, setPrompts] = useState([]);
  const [promptVotes, setPromptVotes] = useState({});
  const [userVotes, setUserVotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({ title: '', description: '' });
  const [formAttachments, setFormAttachments] = useState([]);
  const [expandedPrompt, setExpandedPrompt] = useState(null);
  const [comments, setComments] = useState({});
  const [commentCounts, setCommentCounts] = useState({});
  const [newComment, setNewComment] = useState({});
  const [commentAttachments, setCommentAttachments] = useState([]);
  const [editingComment, setEditingComment] = useState(null);
  const [loadingComments, setLoadingComments] = useState({});

  // Add refs for textareas
  const formDescriptionRef = useRef(null);
  const commentTextAreaRefs = useRef({});

  useEffect(() => {
    fetchPrompts();
  }, []);

  useEffect(() => {
    if (expandedPrompt) {
      fetchComments(expandedPrompt);
      fetchVotes();
    }
  }, [expandedPrompt]);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      console.log("Fetching power prompts...");
      // Direct table approach to avoid view issues
      const { data: promptsData, error: promptsError } = await supabase.
      from('power_prompts_mgg2024').
      select('*').
      order('created_at', { ascending: false });

      if (promptsError) {
        console.error('Error fetching prompts:', promptsError);
        throw promptsError;
      }

      // If we got data directly, enhance it with user info
      if (promptsData && promptsData.length > 0) {
        const enhancedData = await Promise.all(
          promptsData.map(async (prompt) => {
            const { data: userData, error: userError } = await supabase.
            from('profiles_mgg_2024').
            select('full_name,nickname,role').
            eq('id', prompt.user_id).
            single();

            if (userError) {
              console.warn('Error fetching user data for prompt:', userError);
              return {
                ...prompt,
                user_full_name: 'Unknown',
                user_nickname: 'User',
                user_role: 'user'
              };
            }
            return {
              ...prompt,
              user_full_name: userData?.full_name || 'Unknown',
              user_nickname: userData?.nickname || 'User',
              user_role: userData?.role || 'user'
            };
          })
        );

        setPrompts(enhancedData);
      } else {
        setPrompts([]);
      }

      // Fetch votes
      const { data: votesData, error: votesError } = await supabase.
      from('power_prompt_votes_mgg2024').
      select('prompt_id,user_id,vote_type');

      if (votesError) throw votesError;

      // Process votes
      const voteCounts = {};
      const userVoteMap = {};
      votesData?.forEach((vote) => {
        if (!voteCounts[vote.prompt_id]) {
          voteCounts[vote.prompt_id] = { upvotes: 0, downvotes: 0 };
        }
        if (vote.vote_type === 'upvote') {
          voteCounts[vote.prompt_id].upvotes++;
        } else if (vote.vote_type === 'downvote') {
          voteCounts[vote.prompt_id].downvotes++;
        }
        if (vote.user_id === userProfile?.id) {
          userVoteMap[vote.prompt_id] = vote.vote_type;
        }
      });

      setPromptVotes(voteCounts);
      setUserVotes(userVoteMap);

      // Fetch comment counts
      await fetchAllCommentCounts(promptsData || []);
    } catch (error) {
      console.error('Error fetching prompts:', error);
      setStatusMessage({
        type: 'error',
        message: 'Failed to load power prompts: ' + error.message
      });
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCommentCounts = async (promptsList) => {
    if (!promptsList || promptsList.length === 0) return;
    try {
      const { data: commentsData, error } = await supabase.
      from('power_prompt_comments_mgg2024').
      select('prompt_id');

      if (error) throw error;

      const counts = {};
      promptsList.forEach((prompt) => {
        counts[prompt.id] = 0;
      });

      if (commentsData && commentsData.length > 0) {
        commentsData.forEach((comment) => {
          counts[comment.prompt_id] = (counts[comment.prompt_id] || 0) + 1;
        });
      }

      setCommentCounts(counts);
    } catch (error) {
      console.error('Error fetching comment counts:', error);
    }
  };

  const fetchComments = async (promptId) => {
    try {
      setLoadingComments((prev) => ({ ...prev, [promptId]: true }));
      // Try fetching directly from the table
      const { data, error } = await supabase.
      from('power_prompt_comments_mgg2024').
      select('*').
      eq('prompt_id', promptId).
      order('created_at', { ascending: true });

      if (error) throw error;

      // Enhance comments with user data
      const enhancedComments = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: userData, error: userError } = await supabase.
          from('profiles_mgg_2024').
          select('full_name,nickname,role').
          eq('id', comment.user_id).
          single();

          if (userError) {
            console.warn('Error fetching user data for comment:', userError);
            return {
              ...comment,
              user_full_name: 'Unknown',
              user_nickname: 'User',
              user_role: 'user'
            };
          }
          return {
            ...comment,
            user_full_name: userData?.full_name || 'Unknown',
            user_nickname: userData?.nickname || 'User',
            user_role: userData?.role || 'user'
          };
        })
      );

      setComments((prev) => ({ ...prev, [promptId]: enhancedComments }));
      setCommentCounts((prev) => ({ ...prev, [promptId]: enhancedComments?.length || 0 }));
      return enhancedComments;
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    } finally {
      setLoadingComments((prev) => ({ ...prev, [promptId]: false }));
    }
  };

  const fetchVotes = async () => {
    try {
      const { data, error } = await supabase.
      from('power_prompt_votes_mgg2024').
      select('*');

      if (error) throw error;

      const voteCounts = {};
      const userVotes = {};
      data?.forEach((vote) => {
        if (!voteCounts[vote.prompt_id]) {
          voteCounts[vote.prompt_id] = { upvotes: 0, downvotes: 0 };
        }
        if (vote.vote_type === 'upvote') {
          voteCounts[vote.prompt_id].upvotes++;
        } else if (vote.vote_type === 'downvote') {
          voteCounts[vote.prompt_id].downvotes++;
        }
        if (vote.user_id === userProfile?.id) {
          userVotes[vote.prompt_id] = vote.vote_type;
        }
      });

      setPromptVotes(voteCounts);
      setUserVotes(userVotes);
    } catch (error) {
      console.error('Error fetching votes:', error);
    }
  };

  const handleVote = async (promptId, voteType) => {
    if (!userProfile) {
      setStatusMessage({
        type: 'error',
        message: 'You must be logged in to vote'
      });
      return;
    }

    try {
      const currentVote = userVotes[promptId];
      if (currentVote === voteType) {
        // Remove vote if clicking the same button
        const { error } = await supabase.
        from('power_prompt_votes_mgg2024').
        delete().
        eq('prompt_id', promptId).
        eq('user_id', userProfile.id);

        if (error) throw error;

        // Update local state
        setUserVotes((prev) => {
          const newVotes = { ...prev };
          delete newVotes[promptId];
          return newVotes;
        });
        setPromptVotes((prev) => {
          const current = prev[promptId] || { upvotes: 0, downvotes: 0 };
          return {
            ...prev,
            [promptId]: {
              upvotes: voteType === 'upvote' ? Math.max(0, current.upvotes - 1) : current.upvotes,
              downvotes: voteType === 'downvote' ? Math.max(0, current.downvotes - 1) : current.downvotes
            }
          };
        });
      } else {
        // Add or change vote
        const { error } = await supabase.
        from('power_prompt_votes_mgg2024').
        upsert({
          prompt_id: promptId,
          user_id: userProfile.id,
          vote_type: voteType
        });

        if (error) throw error;

        // Update local state
        setUserVotes((prev) => ({ ...prev, [promptId]: voteType }));
        setPromptVotes((prev) => {
          const current = prev[promptId] || { upvotes: 0, downvotes: 0 };
          let newUpvotes = current.upvotes;
          let newDownvotes = current.downvotes;

          // Remove previous vote if exists
          if (currentVote === 'upvote') newUpvotes = Math.max(0, newUpvotes - 1);
          if (currentVote === 'downvote') newDownvotes = Math.max(0, newDownvotes - 1);

          // Add new vote
          if (voteType === 'upvote') newUpvotes++;
          if (voteType === 'downvote') newDownvotes++;

          return {
            ...prev,
            [promptId]: { upvotes: newUpvotes, downvotes: newDownvotes }
          };
        });
      }
    } catch (error) {
      console.error('Error voting on prompt:', error);
      setStatusMessage({
        type: 'error',
        message: 'Failed to vote on prompt: ' + error.message
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setStatusMessage({
        type: 'error',
        message: 'Title and description are required'
      });
      return;
    }

    if (!userProfile) {
      setStatusMessage({
        type: 'error',
        message: 'You must be logged in to submit a prompt'
      });
      return;
    }

    try {
      if (editingPrompt) {
        // Update existing prompt
        const { data, error } = await supabase.
        from('power_prompts_mgg2024').
        update({
          title: form.title.trim(),
          description: form.description.trim(),
          attachments: formAttachments,
          updated_at: new Date().toISOString()
        }).
        eq('id', editingPrompt.id).
        select();

        if (error) throw error;

        // Process mentions in the description
        processMentions(form.description.trim(), 'power_prompt', editingPrompt.id);

        // Get user data to enhance the updated prompt
        const { data: userData, error: userError } = await supabase.
        from('profiles_mgg_2024').
        select('full_name,nickname,role').
        eq('id', editingPrompt.user_id).
        single();

        if (userError) throw userError;

        const updatedPrompt = {
          ...data[0],
          user_full_name: userData?.full_name || 'Unknown',
          user_nickname: userData?.nickname || 'User',
          user_role: userData?.role || 'user'
        };

        setPrompts((prev) =>
        prev.map((prompt) =>
        prompt.id === editingPrompt.id ? updatedPrompt : prompt
        )
        );

        setStatusMessage({
          type: 'success',
          message: 'Prompt updated successfully'
        });
      } else {
        // Create new prompt
        const promptData = {
          title: form.title.trim(),
          description: form.description.trim(),
          user_id: userProfile.id,
          attachments: formAttachments
        };

        const { data, error } = await supabase.
        from('power_prompts_mgg2024').
        insert([promptData]).
        select();

        if (error) throw error;

        // Process mentions in the description
        processMentions(form.description.trim(), 'power_prompt', data[0].id);

        // Get user data to enhance the new prompt
        const { data: userData, error: userError } = await supabase.
        from('profiles_mgg_2024').
        select('full_name,nickname,role').
        eq('id', userProfile.id).
        single();

        if (userError) throw userError;

        const newPromptWithUser = {
          ...data[0],
          user_full_name: userData?.full_name || 'Unknown',
          user_nickname: userData?.nickname || 'User',
          user_role: userData?.role || 'user'
        };

        setPrompts((prev) => [newPromptWithUser, ...prev]);
        setCommentCounts((prev) => ({ ...prev, [data[0].id]: 0 }));

        setStatusMessage({
          type: 'success',
          message: 'Prompt created successfully'
        });
      }

      setForm({ title: '', description: '' });
      setFormAttachments([]);
      setShowCreateForm(false);
      setEditingPrompt(null);

      setTimeout(() => {
        setStatusMessage({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error submitting prompt:', error);
      setStatusMessage({
        type: 'error',
        message: 'Failed to submit prompt: ' + error.message
      });
    }
  };

  const handleAddComment = async (promptId) => {
    const commentText = newComment[promptId];
    if (!commentText || !commentText.trim()) return;

    if (!userProfile) return;

    try {
      const newCommentObj = {
        prompt_id: promptId,
        text: commentText.trim(),
        user_id: userProfile.id,
        attachments: commentAttachments
      };

      const { data, error } = await supabase.
      from('power_prompt_comments_mgg2024').
      insert([newCommentObj]).
      select();

      if (error) throw error;

      // Process mentions in the comment
      processMentions(commentText.trim(), 'power_prompt_comment', promptId);

      // Enhance the comment with user data
      const { data: userData, error: userError } = await supabase.
      from('profiles_mgg_2024').
      select('full_name,nickname,role').
      eq('id', userProfile.id).
      single();

      if (userError) throw userError;

      const newCommentWithUser = {
        ...data[0],
        user_full_name: userData?.full_name || 'Unknown',
        user_nickname: userData?.nickname || 'User',
        user_role: userData?.role || 'user'
      };

      setComments((prev) => ({
        ...prev,
        [promptId]: [...(prev[promptId] || []), newCommentWithUser]
      }));
      setCommentCounts((prev) => ({
        ...prev,
        [promptId]: (prev[promptId] || 0) + 1
      }));
      setNewComment({ ...newComment, [promptId]: '' });
      setCommentAttachments([]);

      setStatusMessage({
        type: 'success',
        message: 'Comment added successfully'
      });

      setTimeout(() => {
        setStatusMessage({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error adding comment:', error);
      setStatusMessage({
        type: 'error',
        message: 'Failed to add comment: ' + error.message
      });
    }
  };

  const handleEditComment = (comment) => {
    setEditingComment({
      id: comment.id,
      prompt_id: comment.prompt_id,
      text: comment.text
    });
  };

  const handleUpdateComment = async () => {
    if (!editingComment || !editingComment.text.trim()) return;

    try {
      const { data, error } = await supabase.
      from('power_prompt_comments_mgg2024').
      update({
        text: editingComment.text.trim(),
        updated_at: new Date().toISOString()
      }).
      eq('id', editingComment.id).
      select();

      if (error) throw error;

      // Process mentions in the updated comment
      processMentions(editingComment.text.trim(), 'power_prompt_comment', editingComment.prompt_id);

      // Get user data to enhance the updated comment
      const { data: userData, error: userError } = await supabase.
      from('profiles_mgg_2024').
      select('full_name,nickname,role').
      eq('id', data[0].user_id).
      single();

      if (userError) throw userError;

      const updatedComment = {
        ...data[0],
        user_full_name: userData?.full_name || 'Unknown',
        user_nickname: userData?.nickname || 'User',
        user_role: userData?.role || 'user'
      };

      setComments((prev) => {
        const promptId = editingComment.prompt_id;
        const updatedComments = {
          ...prev,
          [promptId]: (prev[promptId] || []).map((comment) =>
          comment.id === editingComment.id ? updatedComment : comment
          )
        };
        return updatedComments;
      });

      setEditingComment(null);

      setStatusMessage({
        type: 'success',
        message: 'Comment updated successfully'
      });

      setTimeout(() => {
        setStatusMessage({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error updating comment:', error);
      setStatusMessage({
        type: 'error',
        message: 'Failed to update comment: ' + error.message
      });
    }
  };

  const handleDeleteComment = async (comment) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase.
      from('power_prompt_comments_mgg2024').
      delete().
      eq('id', comment.id);

      if (error) throw error;

      setComments((prev) => ({
        ...prev,
        [comment.prompt_id]: (prev[comment.prompt_id] || []).filter((c) => c.id !== comment.id)
      }));
      setCommentCounts((prev) => ({
        ...prev,
        [comment.prompt_id]: Math.max(0, (prev[comment.prompt_id] || 1) - 1)
      }));

      setStatusMessage({
        type: 'success',
        message: 'Comment deleted successfully'
      });

      setTimeout(() => {
        setStatusMessage({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setStatusMessage({
        type: 'error',
        message: 'Failed to delete comment: ' + error.message
      });
    }
  };

  const handleDeletePrompt = async (promptId) => {
    if (!window.confirm('Are you sure you want to delete this prompt?')) return;

    try {
      const { error } = await supabase.
      from('power_prompts_mgg2024').
      delete().
      eq('id', promptId);

      if (error) throw error;

      setPrompts((prev) => prev.filter((prompt) => prompt.id !== promptId));

      setStatusMessage({
        type: 'success',
        message: 'Prompt deleted successfully'
      });

      setTimeout(() => {
        setStatusMessage({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error deleting prompt:', error);
      setStatusMessage({
        type: 'error',
        message: 'Failed to delete prompt: ' + error.message
      });
    }
  };

  const handleEditPrompt = (prompt) => {
    setEditingPrompt(prompt);
    setForm({
      title: prompt.title,
      description: prompt.description
    });
    setFormAttachments(prompt.attachments || []);
    setShowCreateForm(true);
  };

  const handleExpandPrompt = async (promptId) => {
    if (expandedPrompt === promptId) {
      setExpandedPrompt(null);
    } else {
      setExpandedPrompt(promptId);
      if (!comments[promptId]) {
        await fetchComments(promptId);
      }
    }
  };

  const canUserEditPrompt = (prompt) => {
    return userProfile && (prompt.user_id === userProfile.id || isTechnician());
  };

  const canUserEditComment = (comment) => {
    return userProfile && (comment.user_id === userProfile.id || isTechnician());
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'text-red-600';
      case 'developer':
        return 'text-blue-600';
      case 'user':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getDisplayName = (item) => {
    if (
    item.user_nickname &&
    typeof item.user_nickname === 'string' &&
    item.user_nickname.trim() !== '')
    {
      return item.user_nickname;
    }
    if (
    item.user_full_name &&
    typeof item.user_full_name === 'string' &&
    item.user_full_name.trim() !== '')
    {
      return item.user_full_name;
    }
    return 'Anonymous';
  };

  const filteredPrompts = prompts.filter((prompt) =>
  prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
  prompt.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Comment component
  const CommentItem = ({ comment }) => {
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
            {canUserEditComment(comment) &&
            <div className="flex space-x-2">
                <button
                onClick={() => handleEditComment(comment)}
                className="text-gray-400 hover:text-blue-600">

                  <SafeIcon icon={FiEdit3} className="text-sm" />
                </button>
                <button
                onClick={() => handleDeleteComment(comment)}
                className="text-gray-400 hover:text-red-600">

                  <SafeIcon icon={FiTrash2} className="text-sm" />
                </button>
              </div>
            }
          </div>
          {editingComment && editingComment.id === comment.id ?
          <div className="mt-1 space-y-2">
              <DisplayMentionsTextarea
                value={editingComment.text}
                onChange={(e) => setEditingComment({ ...editingComment, text: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                minRows={2}
              />
              <div className="flex justify-end space-x-2">
                <button
                onClick={handleUpdateComment}
                className="px-3 py-1 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700">
                  Save
                </button>
                <button
                onClick={() => setEditingComment(null)}
                className="px-3 py-1 text-xs text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </div> :
          <>
              <div className="text-sm text-gray-700">
                <CommentWithMentions content={comment.text} />
              </div>
              {comment.attachments && comment.attachments.length > 0 &&
            <div className="mt-3">
                  <AttachmentViewer files={comment.attachments} compact />
                </div>
            }
            </>
          }
        </div>
      </div>);
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="p-6 text-center">
          <SafeIcon icon={FiLoader} className="text-blue-600 text-5xl mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading power prompts...</p>
        </div>
      </div>);
  }

  return (
    <div>
      <Header />
      <div className="p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8">

          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Power Prompts</h1>
            <p className="text-gray-600">Share and discover effective AI prompts</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">

            <SafeIcon icon={FiPlus} />
            <span>Add Prompt</span>
          </button>
        </motion.div>

        {/* Status Message */}
        {statusMessage.message &&
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg mb-6 flex items-center space-x-2 ${
          statusMessage.type === 'success' ?
          'bg-green-50 text-green-700' :
          'bg-red-50 text-red-700'}`
          }>

            <SafeIcon
            icon={statusMessage.type === 'success' ? FiCheckCircle : FiAlertCircle}
            className="flex-shrink-0" />

            <span>{statusMessage.message}</span>
            <button
            onClick={() => setStatusMessage({ type: '', message: '' })}
            className="ml-auto text-gray-500 hover:text-gray-700">

              <SafeIcon icon={FiX} />
            </button>
          </motion.div>
        }

        {/* Create/Edit Form */}
        {showCreateForm &&
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6 mb-8">

            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <SafeIcon icon={FiCommand} className="mr-2 text-blue-600" />
              {editingPrompt ? 'Edit Power Prompt' : 'Create New Power Prompt'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt Title *
                </label>
                <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Enter a descriptive title for your prompt"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt Text *
                </label>
                <div className="relative">
                  <DisplayMentionsTextarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Enter the prompt text that others can use (Type @ to mention users)"
                    minRows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Use markdown formatting for better readability. Include variables like {'{input}'} where users should customize.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <SafeIcon icon={FiPaperclip} className="mr-2" />
                  Attachments
                </label>
                <FileUpload
                onFilesUploaded={setFormAttachments}
                existingFiles={formAttachments}
                maxFiles={3}
                disabled={false}
                compact />

                <p className="text-xs text-gray-500 mt-1">
                  Add screenshots, examples, or documents to help explain your prompt
                </p>
              </div>
              <div className="flex items-center space-x-4 pt-4">
                <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2">

                  <SafeIcon icon={FiCheckCircle} />
                  <span>{editingPrompt ? 'Update Prompt' : 'Save Prompt'}</span>
                </button>
                <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingPrompt(null);
                  setForm({ title: '', description: '' });
                  setFormAttachments([]);
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg transition-colors flex items-center space-x-2">

                  <SafeIcon icon={FiX} />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </motion.div>
        }

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="relative">
            <SafeIcon icon={FiSearch} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search power prompts by title or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        </div>

        {/* Prompts List */}
        <div className="space-y-6">
          {filteredPrompts.map((prompt, index) =>
          <motion.div
            key={prompt.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden">

              {/* Prompt Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <SafeIcon icon={FiCpu} className="text-blue-600" />
                      <h3 className="text-xl font-semibold text-gray-900">{prompt.title}</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      Shared by {getDisplayName(prompt)} on{' '}
                      {format(new Date(prompt.created_at), 'MMM dd, yyyy')}
                      {prompt.updated_at !== prompt.created_at && ` (updated ${format(new Date(prompt.updated_at), 'MMM dd, yyyy')})`}
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap mb-4 border border-gray-200">
                      <CommentWithMentions content={prompt.description} />
                    </div>

                    {/* Prompt Attachments */}
                    {prompt.attachments && prompt.attachments.length > 0 &&
                  <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <SafeIcon icon={FiPaperclip} className="mr-2 text-gray-500" />
                          Attachments
                        </h4>
                        <AttachmentViewer files={prompt.attachments} />
                      </div>
                  }

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Voting Controls */}
                        <div className="flex items-center space-x-2">
                          <button
                          onClick={() => handleVote(prompt.id, 'upvote')}
                          className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                          userVotes[prompt.id] === 'upvote' ?
                          'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'}`
                          }
                          title={userVotes[prompt.id] === 'upvote' ? 'Remove upvote' : 'Upvote'}>

                            <SafeIcon icon={FiThumbsUp} className="text-sm" />
                            <span className="text-sm">
                              {promptVotes[prompt.id]?.upvotes || 0}
                            </span>
                          </button>
                          <button
                          onClick={() => handleVote(prompt.id, 'downvote')}
                          className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                          userVotes[prompt.id] === 'downvote' ?
                          'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'}`
                          }
                          title={userVotes[prompt.id] === 'downvote' ? 'Remove downvote' : 'Downvote'}>

                            <SafeIcon icon={FiThumbsDown} className="text-sm" />
                            <span className="text-sm">
                              {promptVotes[prompt.id]?.downvotes || 0}
                            </span>
                          </button>
                        </div>

                        {/* Comment Count / Expand Button */}
                        <button
                        onClick={() => handleExpandPrompt(prompt.id)}
                        className="flex items-center space-x-1 text-gray-500 hover:text-blue-600">

                          <SafeIcon icon={FiMessageSquare} className="text-sm" />
                          <span className="text-sm">
                            {commentCounts[prompt.id] !== undefined ? commentCounts[prompt.id] : 0} Comments
                          </span>
                        </button>

                        {/* Copy to Clipboard Button */}
                        <button
                        onClick={() => {
                          navigator.clipboard.writeText(prompt.description);
                          setStatusMessage({
                            type: 'success',
                            message: 'Prompt copied to clipboard'
                          });
                          setTimeout(() => setStatusMessage({ type: '', message: '' }), 3000);
                        }}
                        className="text-gray-500 hover:text-blue-600 text-sm">

                          Copy Prompt
                        </button>
                      </div>

                      {/* Edit/Delete Buttons */}
                      {canUserEditPrompt(prompt) &&
                    <div className="flex items-center space-x-2">
                          <button
                        onClick={() => handleEditPrompt(prompt)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit prompt">

                            <SafeIcon icon={FiEdit3} />
                          </button>
                          <button
                        onClick={() => handleDeletePrompt(prompt.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete prompt">

                            <SafeIcon icon={FiTrash2} />
                          </button>
                        </div>
                    }
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments Section (Expanded) */}
              {expandedPrompt === prompt.id &&
            <div className="p-6 bg-gray-50">
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <SafeIcon icon={FiMessageSquare} />
                    <span className="ml-2">Comments ({comments[prompt.id]?.length || 0})</span>
                  </h4>

                  {/* Comment List */}
                  <div className="space-y-4 mb-6">
                    {loadingComments[prompt.id] ?
                <div className="flex justify-center py-4">
                        <SafeIcon icon={FiLoader} className="text-blue-600 animate-spin" />
                        <span className="ml-2 text-gray-600">Loading comments...</span>
                      </div> :

                <>
                        {(comments[prompt.id] || []).length > 0 ?
                  (comments[prompt.id] || []).map((comment) =>
                  <CommentItem key={comment.id} comment={comment} />
                  ) :

                  <p className="text-gray-500 text-center py-4">No comments yet</p>
                  }
                      </>
                }
                  </div>

                  {/* Add Comment */}
                  {userProfile &&
              <div className="border-t border-gray-200 pt-4">
                      <div className="space-y-3">
                        <DisplayMentionsTextarea
                          value={newComment[prompt.id] || ''}
                          onChange={(e) => setNewComment({ ...newComment, [prompt.id]: e.target.value })}
                          placeholder="Add a comment... (Type @ to mention users)"
                          minRows={2}
                        />
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <FileUpload
                            onFilesUploaded={setCommentAttachments}
                            existingFiles={commentAttachments}
                            maxFiles={2}
                            disabled={false}
                            compact
                          />
                          <button
                            onClick={() => handleAddComment(prompt.id)}
                            disabled={!newComment[prompt.id]?.trim()}
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-1 transition-colors">
                            <SafeIcon icon={FiSend} className="text-sm" />
                            <span>Send</span>
                          </button>
                        </div>
                      </div>
                    </div>
              }
                </div>
            }
            </motion.div>
          )}

          {filteredPrompts.length === 0 &&
          <div className="text-center py-12">
              <SafeIcon icon={FiCommand} className="text-gray-300 text-6xl mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No power prompts found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Be the first to share a power prompt!'}
              </p>
              {!searchTerm &&
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">

                  Share Your First Prompt
                </button>
            }
            </div>
          }
        </div>
      </div>
    </div>);
};

export default PowerPrompts;