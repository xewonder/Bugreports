import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useMention } from '../contexts/MentionContext';
import SafeIcon from '../common/SafeIcon';
import Header from './Header';
import FileUpload from './FileUpload';
import AttachmentViewer from './AttachmentViewer';
import EnhancedTextarea from './EnhancedTextarea';
import MentionSuggestions from './MentionSuggestions';
import * as FiIcons from 'react-icons/fi';
import { format } from 'date-fns';
import supabase from '../lib/supabase';

const { FiLightbulb, FiSearch, FiPlus, FiEdit3, FiTrash2, FiMessageCircle, FiSend, FiCheckCircle, FiAlertCircle, FiX, FiLoader, FiThumbsUp, FiPaperclip, FiChevronDown, FiChevronUp } = FiIcons;

const TipsAndTricks = () => {
  const { userProfile, isTechnician } = useAuth();
  const { processMentions, renderWithMentions } = useMention();
  const [tips, setTips] = useState([]);
  const [expandedTip, setExpandedTip] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTip, setEditingTip] = useState(null);
  const [form, setForm] = useState({ title: '', content: '' });
  const [formAttachments, setFormAttachments] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [comments, setComments] = useState({});
  const [commentCounts, setCommentCounts] = useState({});
  const [newComment, setNewComment] = useState({});
  const [commentAttachments, setCommentAttachments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [votes, setVotes] = useState({ counts: {}, userVotes: {} });
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });
  const [loadingComments, setLoadingComments] = useState({});
  const commentsEndRef = useRef(null);

  // Add refs for textareas
  const commentTextAreaRefs = useRef({});
  const formTextAreaRef = useRef(null);

  useEffect(() => {
    fetchTips();
  }, []);

  useEffect(() => {
    if (expandedTip) {
      fetchComments(expandedTip);
    }
  }, [expandedTip]);

  useEffect(() => {
    if (expandedTip && comments[expandedTip]?.length > 0) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, expandedTip]);

  const fetchTips = async () => {
    try {
      setLoading(true);
      console.log("Fetching tips and tricks...");
      // Direct table approach
      const { data, error } = await supabase
        .from('tips_and_tricks_mgg2024')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enhance tips with user data if we have data
      if (data && data.length > 0) {
        const enhancedData = await Promise.all(data.map(async (tip) => {
          const { data: userData, error: userError } = await supabase
            .from('profiles_mgg_2024')
            .select('full_name,nickname,role')
            .eq('id', tip.user_id)
            .single();

          if (userError) {
            console.warn('Error fetching user data for tip:', userError);
            return { ...tip, user_full_name: 'Unknown', user_nickname: 'User', user_role: 'user' };
          }
          
          return { 
            ...tip, 
            user_full_name: userData?.full_name || 'Unknown', 
            user_nickname: userData?.nickname || 'User', 
            user_role: userData?.role || 'user' 
          };
        }));

        setTips(enhancedData);
      } else {
        setTips([]);
      }
      
      await fetchVotes();
      await fetchAllCommentCounts(data || []);
    } catch (error) {
      console.error('Error fetching tips and tricks:', error);
      setStatusMessage({ type: 'error', message: 'Failed to load tips and tricks: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCommentCounts = async (tipsList) => {
    if (!tipsList || tipsList.length === 0) return;
    
    try {
      const { data: commentsData, error } = await supabase
        .from('tips_comments_mgg2024')
        .select('tip_id');

      if (error) throw error;

      const counts = {};
      // Initialize all tips with 0 count
      tipsList.forEach(tip => {
        counts[tip.id] = 0;
      });

      // Count actual comments
      if (commentsData && commentsData.length > 0) {
        commentsData.forEach(comment => {
          counts[comment.tip_id] = (counts[comment.tip_id] || 0) + 1;
        });
      }

      setCommentCounts(counts);
    } catch (error) {
      console.error('Error fetching comment counts:', error);
    }
  };

  const fetchComments = async (tipId) => {
    try {
      setLoadingComments(prev => ({ ...prev, [tipId]: true }));

      const { data, error } = await supabase
        .from('tips_comments_mgg2024')
        .select('*')
        .eq('tip_id', tipId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Enhance comments with user data
      const enhancedComments = await Promise.all((data || []).map(async (comment) => {
        const { data: userData, error: userError } = await supabase
          .from('profiles_mgg_2024')
          .select('full_name,nickname,role')
          .eq('id', comment.user_id)
          .single();

        if (userError) {
          console.warn('Error fetching user data for comment:', userError);
          return { ...comment, user_full_name: 'Unknown', user_nickname: 'User', user_role: 'user' };
        }
        
        return { 
          ...comment, 
          user_full_name: userData?.full_name || 'Unknown', 
          user_nickname: userData?.nickname || 'User', 
          user_role: userData?.role || 'user' 
        };
      }));

      setComments(prev => ({ ...prev, [tipId]: enhancedComments }));
      setCommentCounts(prev => ({ ...prev, [tipId]: enhancedComments?.length || 0 }));
      return enhancedComments;
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    } finally {
      setLoadingComments(prev => ({ ...prev, [tipId]: false }));
    }
  };

  const fetchVotes = async () => {
    try {
      const { data, error } = await supabase
        .from('tips_votes_mgg2024')
        .select('*');

      if (error) throw error;

      const voteCounts = {};
      const userVotes = {};

      data?.forEach(vote => {
        voteCounts[vote.tip_id] = (voteCounts[vote.tip_id] || 0) + 1;
        if (vote.user_id === userProfile?.id) {
          userVotes[vote.tip_id] = true;
        }
      });

      setVotes({ counts: voteCounts, userVotes: userVotes });
    } catch (error) {
      console.error('Error fetching votes:', error);
    }
  };

  const handleSubmitTip = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = {};
    if (!form.title.trim()) errors.title = 'Title is required';
    if (!form.content.trim()) errors.content = 'Content is required';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    if (!userProfile) {
      setStatusMessage({ type: 'error', message: 'You must be logged in to create a tip' });
      return;
    }
    
    setFormSubmitting(true);
    
    try {
      if (editingTip) {
        // Update existing tip
        const { data, error } = await supabase
          .from('tips_and_tricks_mgg2024')
          .update({
            title: form.title.trim(),
            content: form.content.trim(),
            attachments: formAttachments,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTip.id)
          .select();

        if (error) throw error;

        // Process mentions in the tip content
        processMentions(form.content.trim(), 'tip', editingTip.id);
        
        // Get user data to enhance the updated tip
        const { data: userData, error: userError } = await supabase
          .from('profiles_mgg_2024')
          .select('full_name,nickname,role')
          .eq('id', editingTip.user_id)
          .single();

        if (userError) throw userError;

        const updatedTip = {
          ...data[0],
          user_full_name: userData?.full_name || 'Unknown',
          user_nickname: userData?.nickname || 'User',
          user_role: userData?.role || 'user'
        };

        setTips(prev => prev.map(tip => 
          tip.id === editingTip.id ? updatedTip : tip
        ));

        setStatusMessage({ type: 'success', message: 'Tip updated successfully!' });
      } else {
        // Create new tip
        const tipData = {
          title: form.title.trim(),
          content: form.content.trim(),
          user_id: userProfile.id,
          attachments: formAttachments
        };

        const { data, error } = await supabase
          .from('tips_and_tricks_mgg2024')
          .insert([tipData])
          .select();

        if (error) throw error;
        
        // Process mentions in the tip content
        processMentions(form.content.trim(), 'tip', data[0].id);

        // Get user data to enhance the new tip
        const { data: userData, error: userError } = await supabase
          .from('profiles_mgg_2024')
          .select('full_name,nickname,role')
          .eq('id', userProfile.id)
          .single();

        if (userError) throw userError;

        const newTipWithUser = {
          ...data[0],
          user_full_name: userData?.full_name || 'Unknown',
          user_nickname: userData?.nickname || 'User',
          user_role: userData?.role || 'user'
        };

        setTips([newTipWithUser, ...tips]);
        setCommentCounts(prev => ({ ...prev, [data[0].id]: 0 }));
        setStatusMessage({ type: 'success', message: 'Tip created successfully!' });
      }
      
      setForm({ title: '', content: '' });
      setFormAttachments([]);
      setShowForm(false);
      setEditingTip(null);
      
      setTimeout(() => {
        setStatusMessage({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error submitting tip:', error);
      setStatusMessage({ type: 'error', message: 'Failed to submit tip: ' + error.message });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleVote = async (tipId) => {
    if (!userProfile) {
      setStatusMessage({ type: 'error', message: 'You must be logged in to vote' });
      return;
    }
    
    try {
      const hasVoted = votes.userVotes?.[tipId];
      
      if (hasVoted) {
        // Remove vote
        const { error } = await supabase
          .from('tips_votes_mgg2024')
          .delete()
          .eq('tip_id', tipId)
          .eq('user_id', userProfile.id);

        if (error) throw error;
        
        setVotes(prev => ({
          counts: { ...prev.counts, [tipId]: Math.max(0, (prev.counts[tipId] || 0) - 1) },
          userVotes: { ...prev.userVotes, [tipId]: false }
        }));
      } else {
        // Add vote
        const { error } = await supabase
          .from('tips_votes_mgg2024')
          .insert([{
            tip_id: tipId,
            user_id: userProfile.id,
            vote_type: 'upvote'
          }]);

        if (error) throw error;
        
        setVotes(prev => ({
          counts: { ...prev.counts, [tipId]: (prev.counts[tipId] || 0) + 1 },
          userVotes: { ...prev.userVotes, [tipId]: true }
        }));
      }
    } catch (error) {
      console.error('Error voting on tip:', error);
      setStatusMessage({ type: 'error', message: 'Failed to update vote: ' + error.message });
    }
  };

  const handleAddComment = async (tipId) => {
    const text = newComment[tipId];
    if (!text || !text.trim()) return;
    if (!userProfile) return;
    
    try {
      const { data, error } = await supabase
        .from('tips_comments_mgg2024')
        .insert([{
          tip_id: tipId,
          text: text.trim(),
          user_id: userProfile.id,
          attachments: commentAttachments
        }])
        .select();

      if (error) throw error;
      
      // Process mentions in the comment
      processMentions(text.trim(), 'tip_comment', tipId);

      // Enhance the comment with user data
      const { data: userData, error: userError } = await supabase
        .from('profiles_mgg_2024')
        .select('full_name,nickname,role')
        .eq('id', userProfile.id)
        .single();

      if (userError) throw userError;

      const newCommentWithUser = {
        ...data[0],
        user_full_name: userData?.full_name || 'Unknown',
        user_nickname: userData?.nickname || 'User',
        user_role: userData?.role || 'user'
      };

      setComments(prev => ({ 
        ...prev, 
        [tipId]: [...(prev[tipId] || []), newCommentWithUser] 
      }));
      setCommentCounts(prev => ({ ...prev, [tipId]: (prev[tipId] || 0) + 1 }));
      setNewComment({ ...newComment, [tipId]: '' });
      setCommentAttachments([]);
      
      setStatusMessage({ type: 'success', message: 'Comment added successfully' });
      setTimeout(() => {
        setStatusMessage({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error adding comment:', error);
      setStatusMessage({ type: 'error', message: 'Failed to add comment: ' + error.message });
    }
  };

  const handleDeleteComment = async (comment) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      const { error } = await supabase
        .from('tips_comments_mgg2024')
        .delete()
        .eq('id', comment.id);

      if (error) throw error;
      
      setComments(prev => ({ 
        ...prev, 
        [comment.tip_id]: (prev[comment.tip_id] || []).filter(c => c.id !== comment.id) 
      }));
      setCommentCounts(prev => ({ 
        ...prev, 
        [comment.tip_id]: Math.max(0, (prev[comment.tip_id] || 1) - 1) 
      }));
      
      setStatusMessage({ type: 'success', message: 'Comment deleted successfully' });
      setTimeout(() => {
        setStatusMessage({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setStatusMessage({ type: 'error', message: 'Failed to delete comment' });
    }
  };

  const handleDeleteTip = async (tipId) => {
    if (!window.confirm('Are you sure you want to delete this tip?')) return;
    
    try {
      const { error } = await supabase
        .from('tips_and_tricks_mgg2024')
        .delete()
        .eq('id', tipId);

      if (error) throw error;
      
      setTips(prev => prev.filter(tip => tip.id !== tipId));
      
      setStatusMessage({ type: 'success', message: 'Tip deleted successfully' });
      setTimeout(() => {
        setStatusMessage({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error deleting tip:', error);
      setStatusMessage({ type: 'error', message: 'Failed to delete tip' });
    }
  };

  const handleEditTip = (tip) => {
    setEditingTip(tip);
    setForm({
      title: tip.title,
      content: tip.content
    });
    setFormAttachments(tip.attachments || []);
    setShowForm(true);
  };

  const handleExpandTip = async (tipId) => {
    if (expandedTip === tipId) {
      setExpandedTip(null);
    } else {
      setExpandedTip(tipId);
      if (!comments[tipId]) {
        await fetchComments(tipId);
      }
    }
  };

  const canUserEditTip = (tip) => {
    return userProfile && (tip.user_id === userProfile.id || isTechnician());
  };

  const canUserEditComment = (comment) => {
    return userProfile && (comment.user_id === userProfile.id || isTechnician());
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'text-red-600';
      case 'developer': return 'text-blue-600';
      case 'user': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  // Helper function to get display name with proper fallback
  const getDisplayName = (item) => {
    if (item.user_nickname && typeof item.user_nickname === 'string' && item.user_nickname.trim() !== '') {
      return item.user_nickname;
    }
    if (item.user_full_name && typeof item.user_full_name === 'string' && item.user_full_name.trim() !== '') {
      return item.user_full_name;
    }
    return 'Anonymous';
  };

  const filteredTips = tips
    .filter(tip => 
      tip.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tip.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'votes') {
        return (votes.counts[b.id] || 0) - (votes.counts[a.id] || 0);
      } else if (sortBy === 'created_at') {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return 0;
    });

  // Comment component
  const CommentItem = ({ comment }) => (
    <div className="flex space-x-3 pb-4 mb-4 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
        <span className="text-sm font-medium text-gray-700">
          {getDisplayName(comment)[0]}
        </span>
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900">
              {getDisplayName(comment)}
            </span>
            <span className={`text-xs ${getRoleColor(comment.user_role)}`}>
              {comment.user_role}
            </span>
            <span className="text-xs text-gray-500">
              {format(new Date(comment.created_at), 'MMM dd, yyyy HH:mm')}
              {comment.updated_at && comment.updated_at !== comment.created_at && ' (edited)'}
            </span>
          </div>
          {canUserEditComment(comment) && (
            <div className="flex space-x-2">
              <button
                onClick={() => handleDeleteComment(comment)}
                className="text-gray-400 hover:text-red-600"
              >
                <SafeIcon icon={FiTrash2} className="text-sm" />
              </button>
            </div>
          )}
        </div>
        <div className="text-sm text-gray-700">
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

  if (loading) {
    return (
      <div>
        <Header />
        <div className="p-6 text-center">
          <SafeIcon icon={FiLoader} className="text-blue-600 text-5xl mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading tips and tricks...</p>
        </div>
      </div>
    );
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
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tips & Tricks</h1>
            <p className="text-gray-600">Share and discover useful tips for MGG™</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <SafeIcon icon={FiPlus} />
            <span>New Tip</span>
          </button>
        </motion.div>

        {/* Status Message */}
        {statusMessage.message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg mb-6 flex items-center space-x-2 ${
              statusMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            <SafeIcon
              icon={statusMessage.type === 'success' ? FiCheckCircle : FiAlertCircle}
              className="flex-shrink-0"
            />
            <span>{statusMessage.message}</span>
            <button
              onClick={() => setStatusMessage({ type: '', message: '' })}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              <SafeIcon icon={FiX} />
            </button>
          </motion.div>
        )}

        {/* Create/Edit Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 mb-8"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <SafeIcon icon={FiLightbulb} className="mr-2 text-amber-600" />
              {editingTip ? 'Edit Tip' : 'Share New Tip'}
            </h2>
            <form onSubmit={handleSubmitTip} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tip Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => {
                    setForm({ ...form, title: e.target.value });
                    if (formErrors.title) setFormErrors({ ...formErrors, title: '' });
                  }}
                  placeholder="Enter a descriptive title for your tip"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    formErrors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={formSubmitting}
                />
                {formErrors.title && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <div className="relative">
                  <EnhancedTextarea
                    ref={formTextAreaRef}
                    value={form.content}
                    onChange={(e) => {
                      setForm({ ...form, content: e.target.value });
                      if (formErrors.content) setFormErrors({ ...formErrors, content: '' });
                    }}
                    placeholder="Share your tip or trick in detail (Type @ to mention users)"
                    minRows={8}
                    className={`${formErrors.content ? 'border-red-300' : 'border-gray-300'} focus:ring-amber-500`}
                    disabled={formSubmitting}
                  />
                  <MentionSuggestions textAreaRef={formTextAreaRef} />
                </div>
                {formErrors.content && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.content}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Share step-by-step instructions, shortcuts, or best practices.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachments
                </label>
                <FileUpload
                  onFilesUploaded={setFormAttachments}
                  existingFiles={formAttachments}
                  maxFiles={3}
                  disabled={formSubmitting}
                  compact
                />
              </div>
              <div className="flex items-center space-x-4 pt-4">
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  disabled={formSubmitting}
                >
                  <SafeIcon icon={FiCheckCircle} />
                  <span>{editingTip ? 'Update Tip' : 'Share Tip'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTip(null);
                    setForm({ title: '', content: '' });
                    setFormAttachments([]);
                    setFormErrors({});
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  disabled={formSubmitting}
                >
                  <SafeIcon icon={FiX} />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <SafeIcon icon={FiSearch} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search tips and tricks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="created_at">Newest First</option>
                <option value="votes">Most Voted</option>
              </select>
            </div>
            <div className="flex items-center justify-center bg-gray-50 rounded-lg px-4 py-2">
              <span className="text-sm text-gray-600">
                {filteredTips.length} of {tips.length} tips
              </span>
            </div>
          </div>
        </div>

        {/* Tips List */}
        <div className="space-y-6">
          {filteredTips.map((tip, index) => (
            <motion.div
              key={tip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              {/* Tip Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <SafeIcon icon={FiLightbulb} className="text-amber-600" />
                      <h3
                        className="text-xl font-semibold text-gray-900 hover:text-amber-600 transition-colors cursor-pointer"
                        onClick={() => handleExpandTip(tip.id)}
                      >
                        {tip.title}
                      </h3>
                    </div>
                    {/* User and Date */}
                    <p className="text-sm text-gray-500 mb-4">
                      Shared by {getDisplayName(tip)} on{' '}
                      {format(new Date(tip.created_at), 'MMM dd, yyyy')}
                      {tip.updated_at !== tip.created_at && 
                        ` (updated ${format(new Date(tip.updated_at), 'MMM dd, yyyy')})`}
                    </p>
                    {/* Tip Content Preview */}
                    <div className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap mb-4 border border-gray-200">
                      {tip.content.length > 200 ? (
                        <div>
                          {renderWithMentions(tip.content.substring(0, 200))}...
                        </div>
                      ) : (
                        renderWithMentions(tip.content)
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Voting Controls */}
                        <button
                          onClick={() => handleVote(tip.id)}
                          className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                            votes.userVotes?.[tip.id]
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-600'
                          }`}
                          title={votes.userVotes?.[tip.id] ? 'Remove vote' : 'Vote for this tip'}
                        >
                          <SafeIcon icon={FiThumbsUp} className="text-sm" />
                          <span className="text-sm">{votes.counts?.[tip.id] || 0}</span>
                        </button>
                        {/* Comment Count / Expand Button */}
                        <button
                          onClick={() => handleExpandTip(tip.id)}
                          className="flex items-center space-x-1 text-gray-500 hover:text-amber-600"
                        >
                          <SafeIcon icon={FiMessageCircle} className="text-sm" />
                          <span className="text-sm">
                            {commentCounts[tip.id] !== undefined ? commentCounts[tip.id] : 0} Comments
                          </span>
                        </button>
                        {/* Show full content button if truncated */}
                        {tip.content.length > 200 && (
                          <button
                            onClick={() => handleExpandTip(tip.id)}
                            className="text-gray-500 hover:text-amber-600 text-sm"
                          >
                            Read More
                          </button>
                        )}
                      </div>
                      {/* Edit/Delete Buttons */}
                      {canUserEditTip(tip) && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditTip(tip)}
                            className="p-1 text-gray-400 hover:text-amber-600 transition-colors"
                            title="Edit tip"
                          >
                            <SafeIcon icon={FiEdit3} />
                          </button>
                          <button
                            onClick={() => handleDeleteTip(tip.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete tip"
                          >
                            <SafeIcon icon={FiTrash2} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Content - Comments Section */}
              {expandedTip === tip.id && (
                <div className="p-6 bg-gray-50 border-t border-gray-100">
                  <div className="mb-4">
                    <div className="text-gray-700 whitespace-pre-wrap font-mono">
                      {renderWithMentions(tip.content)}
                    </div>
                  </div>
                  
                  {/* Tip Attachments */}
                  {tip.attachments && tip.attachments.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <SafeIcon icon={FiPaperclip} className="mr-2 text-gray-500" />
                        Attachments
                      </h4>
                      <AttachmentViewer files={tip.attachments} />
                    </div>
                  )}

                  <div className="mt-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <SafeIcon icon={FiMessageCircle} className="mr-2 text-amber-600" />
                      <span>Comments ({comments[tip.id]?.length || 0})</span>
                    </h4>
                    
                    {/* Comments List */}
                    <div className="space-y-4 max-h-96 overflow-y-auto mb-6 p-1">
                      {loadingComments[tip.id] ? (
                        <div className="flex justify-center py-4">
                          <SafeIcon icon={FiLoader} className="text-amber-600 animate-spin" />
                          <span className="ml-2 text-gray-600">Loading comments...</span>
                        </div>
                      ) : (
                        <>
                          {(comments[tip.id] || []).length > 0 ? (
                            (comments[tip.id] || []).map((comment) => (
                              <CommentItem key={comment.id} comment={comment} />
                            ))
                          ) : (
                            <p className="text-center text-gray-500 py-4">
                              No comments yet. Be the first to comment!
                            </p>
                          )}
                        </>
                      )}
                      <div ref={commentsEndRef} />
                    </div>
                    
                    {/* Add Comment */}
                    {userProfile ? (
                      <div className="space-y-3">
                        <div className="relative">
                          <EnhancedTextarea
                            ref={(el) => (commentTextAreaRefs.current[tip.id] = el)}
                            value={newComment[tip.id] || ''}
                            onChange={(e) => setNewComment({ ...newComment, [tip.id]: e.target.value })}
                            placeholder="Add a comment... (Type @ to mention users)"
                            minRows={3}
                            disabled={commentLoading}
                          />
                          <MentionSuggestions 
                            textAreaRef={{ current: commentTextAreaRefs.current[tip.id] }} 
                          />
                        </div>
                        <FileUpload
                          onFilesUploaded={setCommentAttachments}
                          existingFiles={commentAttachments}
                          maxFiles={2}
                          disabled={commentLoading}
                          compact
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleAddComment(tip.id)}
                            disabled={!newComment[tip.id]?.trim() || commentLoading}
                            className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:from-amber-400 disabled:to-amber-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-sm"
                          >
                            {commentLoading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <SafeIcon icon={FiSend} />
                            )}
                            <span>Submit</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-2">
                        Please sign in to add comments.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {filteredTips.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-md p-8 text-center"
            >
              <SafeIcon icon={FiLightbulb} className="text-gray-400 text-6xl mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No tips found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Be the first to share a useful tip!'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Share Your First Tip
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TipsAndTricks;