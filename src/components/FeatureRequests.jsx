import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useMention } from '../contexts/MentionContext';
import SafeIcon from '../common/SafeIcon';
import Header from './Header';
import FileUpload from './FileUpload';
import AttachmentViewer from './AttachmentViewer';
import DisplayMentionsTextarea from './DisplayMentionsTextarea';
import MoveToRoadmapModal from './MoveToRoadmapModal';
import * as FiIcons from 'react-icons/fi';
import { format } from 'date-fns';
import supabase from '../lib/supabase';

const { FiStar, FiSearch, FiFilter, FiPlus, FiEdit3, FiTrash2, FiMessageCircle, FiSend, FiCheckCircle, FiAlertCircle, FiX, FiChevronDown, FiChevronUp, FiLoader, FiThumbsUp, FiPaperclip, FiMap, FiUser } = FiIcons;

const FeatureRequests = () => {
  const { userProfile, isTechnician } = useAuth();
  const { processMentions, renderWithMentions } = useMention();
  const [features, setFeatures] = useState([]);
  const [expandedFeature, setExpandedFeature] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [userFilter, setUserFilter] = useState('All'); // New filter for user's content
  const [sortBy, setSortBy] = useState('votes');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', tags: '' });
  const [formAttachments, setFormAttachments] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState('');
  const [commentAttachments, setCommentAttachments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [votes, setVotes] = useState({ counts: {}, userVotes: {} });
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });
  const [newComment, setNewComment] = useState({});
  const [commentCounts, setCommentCounts] = useState({});
  const [loadingComments, setLoadingComments] = useState({});
  const [showMoveToRoadmapModal, setShowMoveToRoadmapModal] = useState(false);
  const [featureToMove, setFeatureToMove] = useState(null);
  const [userComments, setUserComments] = useState({}); // Track features where user commented
  const commentsEndRef = useRef(null);

  useEffect(() => {
    fetchFeatures();
  }, []);

  useEffect(() => {
    if (expandedFeature) {
      fetchComments(expandedFeature);
      fetchVotes();
    }
  }, [expandedFeature]);

  useEffect(() => {
    if (userProfile) {
      fetchUserComments();
    }
  }, [userProfile, features]);

  useEffect(() => {
    if (expandedFeature && comments[expandedFeature]?.length > 0) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, expandedFeature]);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      console.log("Fetching feature requests...");
      // First try the direct table if views are having issues
      let { data, error: fetchError } = await supabase.
      from('feature_requests_mgg2024').
      select('*').
      order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching from direct table:', fetchError);
        throw fetchError;
      }

      console.log("Feature data from database:", data);

      // If we got data directly, enhance it with user info
      if (data && data.length > 0) {
        const enhancedData = await Promise.all(
          data.map(async (feature) => {
            const { data: userData, error: userError } = await supabase.
            from('profiles_mgg_2024').
            select('full_name,nickname,role').
            eq('id', feature.user_id).
            single();

            if (userError) {
              console.warn('Error fetching user data for feature:', userError);
              return { ...feature, user_full_name: 'Unknown', user_nickname: 'User', user_role: 'user' };
            }
            return { ...feature, user_full_name: userData?.full_name || 'Unknown', user_nickname: userData?.nickname || 'User', user_role: userData?.role || 'user' };
          })
        );

        setFeatures(enhancedData);
      } else {
        setFeatures([]);
      }

      await fetchVotes();
      await fetchAllCommentCounts(data || []);
    } catch (error) {
      console.error('Error fetching feature requests:', error);
      setStatusMessage({ type: 'error', message: 'Failed to load feature requests: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCommentCounts = async (featuresList) => {
    if (!featuresList || featuresList.length === 0) return;
    try {
      const { data: commentsData, error } = await supabase.
      from('feature_request_comments_mgg2024').
      select('feature_request_id');

      if (error) throw error;

      const counts = {};
      featuresList.forEach((feature) => {
        counts[feature.id] = 0;
      });

      if (commentsData && commentsData.length > 0) {
        commentsData.forEach((comment) => {
          counts[comment.feature_request_id] = (counts[comment.feature_request_id] || 0) + 1;
        });
      }

      setCommentCounts(counts);
    } catch (error) {
      console.error('Error fetching comment counts:', error);
    }
  };

  const fetchUserComments = async () => {
    if (!userProfile) return;

    try {
      // Fetch comments made by the current user
      const { data, error } = await supabase.
      from('feature_request_comments_mgg2024').
      select('feature_request_id').
      eq('user_id', userProfile.id);

      if (error) throw error;

      // Create a map of features where the user has commented
      const commentedFeatures = {};
      data?.forEach((comment) => {
        commentedFeatures[comment.feature_request_id] = true;
      });

      setUserComments(commentedFeatures);
    } catch (error) {
      console.error('Error fetching user comments:', error);
    }
  };

  const fetchComments = async (featureId) => {
    try {
      setLoadingComments((prev) => ({ ...prev, [featureId]: true }));
      // Try fetching directly from the table
      const { data, error } = await supabase.
      from('feature_request_comments_mgg2024').
      select('*').
      eq('feature_request_id', featureId).
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
            return { ...comment, user_full_name: 'Unknown', user_nickname: 'User', user_role: 'user' };
          }
          return { ...comment, user_full_name: userData?.full_name || 'Unknown', user_nickname: userData?.nickname || 'User', user_role: userData?.role || 'user' };
        })
      );

      setComments((prev) => ({ ...prev, [featureId]: enhancedComments }));
      setCommentCounts((prev) => ({ ...prev, [featureId]: enhancedComments?.length || 0 }));
      return enhancedComments;
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    } finally {
      setLoadingComments((prev) => ({ ...prev, [featureId]: false }));
    }
  };

  const fetchVotes = async () => {
    try {
      const { data, error } = await supabase.
      from('feature_request_votes_mgg2024').
      select('*');

      if (error) throw error;

      const voteCounts = {};
      const userVotes = {};
      data?.forEach((vote) => {
        voteCounts[vote.feature_request_id] = (voteCounts[vote.feature_request_id] || 0) + 1;
        if (vote.user_id === userProfile?.id) {
          userVotes[vote.feature_request_id] = true;
        }
      });

      setVotes({ counts: voteCounts, userVotes: userVotes });
    } catch (error) {
      console.error('Error fetching votes:', error);
    }
  };

  const handleSubmitFeature = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!form.title.trim()) errors.title = 'Title is required';
    if (!form.description.trim()) errors.description = 'Description is required';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (!userProfile) {
      setStatusMessage({ type: 'error', message: 'You must be logged in to submit a feature request' });
      return;
    }

    setFormSubmitting(true);
    try {
      const tagsArray = form.tags ?
      form.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0) :
      [];

      if (editingFeature) {
        // Update existing feature
        const { data, error } = await supabase.
        from('feature_requests_mgg2024').
        update({
          title: form.title.trim(),
          description: form.description.trim(),
          priority: form.priority,
          tags: tagsArray,
          attachments: formAttachments,
          updated_at: new Date().toISOString()
        }).
        eq('id', editingFeature.id).
        select();

        if (error) throw error;

        // Get user data to enhance the updated feature
        const { data: userData, error: userError } = await supabase.
        from('profiles_mgg_2024').
        select('full_name,nickname,role').
        eq('id', editingFeature.user_id).
        single();

        if (userError) throw userError;

        const updatedFeature = {
          ...data[0],
          user_full_name: userData?.full_name || 'Unknown',
          user_nickname: userData?.nickname || 'User',
          user_role: userData?.role || 'user'
        };

        setFeatures((prev) =>
        prev.map((feature) => feature.id === editingFeature.id ? updatedFeature : feature)
        );

        // Process mentions in the feature description
        processMentions(form.description.trim(), 'feature', editingFeature.id);
        setStatusMessage({ type: 'success', message: 'Feature request updated successfully!' });
      } else {
        // Create new feature
        const featureData = {
          title: form.title.trim(),
          description: form.description.trim(),
          priority: form.priority,
          status: 'requested',
          user_id: userProfile.id,
          user_name: userProfile?.nickname || userProfile?.full_name || 'Unknown',
          tags: tagsArray,
          attachments: formAttachments
        };

        const { data, error } = await supabase.
        from('feature_requests_mgg2024').
        insert([featureData]).
        select();

        if (error) throw error;

        // Process mentions in the feature description
        processMentions(form.description.trim(), 'feature', data[0].id);

        // Get user data to enhance the new feature
        const { data: userData, error: userError } = await supabase.
        from('profiles_mgg_2024').
        select('full_name,nickname,role').
        eq('id', userProfile.id).
        single();

        if (userError) throw userError;

        const newFeature = {
          ...data[0],
          user_full_name: userData?.full_name || 'Unknown',
          user_nickname: userData?.nickname || 'User',
          user_role: userData?.role || 'user'
        };

        setFeatures((prev) => [newFeature, ...prev]);
        setCommentCounts((prev) => ({ ...prev, [data[0].id]: 0 }));
        setStatusMessage({ type: 'success', message: 'Feature request submitted successfully!' });
      }

      setForm({ title: '', description: '', priority: 'medium', tags: '' });
      setFormAttachments([]);
      setShowForm(false);
      setEditingFeature(null);

      setTimeout(() => {
        setStatusMessage({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error submitting feature request:', error);
      setStatusMessage({ type: 'error', message: 'Failed to submit feature request: ' + error.message });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleVote = async (featureId) => {
    if (!userProfile) {
      setStatusMessage({ type: 'error', message: 'You must be logged in to vote' });
      return;
    }

    try {
      const hasVoted = votes.userVotes?.[featureId];
      if (hasVoted) {
        // Remove vote
        const { error } = await supabase.
        from('feature_request_votes_mgg2024').
        delete().
        eq('feature_request_id', featureId).
        eq('user_id', userProfile.id);

        if (error) throw error;

        setVotes((prev) => ({
          counts: { ...prev.counts, [featureId]: Math.max(0, (prev.counts[featureId] || 0) - 1) },
          userVotes: { ...prev.userVotes, [featureId]: false }
        }));
      } else {
        // Add vote
        const { error } = await supabase.
        from('feature_request_votes_mgg2024').
        insert([{ feature_request_id: featureId, user_id: userProfile.id }]);

        if (error) throw error;

        setVotes((prev) => ({
          counts: { ...prev.counts, [featureId]: (prev.counts[featureId] || 0) + 1 },
          userVotes: { ...prev.userVotes, [featureId]: true }
        }));
      }
    } catch (error) {
      console.error('Error voting on feature:', error);
      setStatusMessage({ type: 'error', message: 'Failed to update vote: ' + error.message });
    }
  };

  const handleAddComment = async (featureId) => {
    const text = newComment[featureId];
    if (!text || !text.trim()) return;
    if (!userProfile) {
      setStatusMessage({ type: 'error', message: 'You must be logged in to comment' });
      return;
    }

    try {
      const commentData = {
        feature_request_id: featureId,
        text: text.trim(),
        user_id: userProfile.id,
        attachments: commentAttachments
      };

      const { data, error } = await supabase.
      from('feature_request_comments_mgg2024').
      insert([commentData]).
      select();

      if (error) throw error;

      // Process mentions in the comment
      processMentions(text.trim(), 'feature_comment', featureId);

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

      setComments((prev) => ({ ...prev, [featureId]: [...(prev[featureId] || []), newCommentWithUser] }));
      setCommentCounts((prev) => ({ ...prev, [featureId]: (prev[featureId] || 0) + 1 }));
      setNewComment({ ...newComment, [featureId]: '' });
      setCommentAttachments([]);

      // Update userComments to reflect the new comment
      setUserComments((prev) => ({ ...prev, [featureId]: true }));

      setStatusMessage({ type: 'success', message: 'Comment added successfully' });
      setTimeout(() => {
        setStatusMessage({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error adding comment:', error);
      setStatusMessage({ type: 'error', message: 'Failed to add comment: ' + error.message });
    }
  };

  const handleEditFeature = (feature) => {
    setEditingFeature(feature);
    setForm({
      title: feature.title,
      description: feature.description,
      priority: feature.priority,
      tags: feature.tags ? feature.tags.join(',') : ''
    });
    setFormAttachments(feature.attachments || []);
    setShowForm(true);
  };

  const handleDeleteFeature = async (featureId) => {
    if (!confirm('Are you sure you want to delete this feature request?')) return;

    try {
      const { error } = await supabase.from('feature_requests_mgg2024').delete().eq('id', featureId);

      if (error) throw error;

      setFeatures((prev) => prev.filter((feature) => feature.id !== featureId));
      setStatusMessage({ type: 'success', message: 'Feature request deleted successfully' });
      setTimeout(() => {
        setStatusMessage({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error deleting feature:', error);
      setStatusMessage({ type: 'error', message: 'Failed to delete feature request' });
    }
  };

  const handleDeleteComment = async (comment) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase.
      from('feature_request_comments_mgg2024').
      delete().
      eq('id', comment.id);

      if (error) throw error;

      setComments((prev) => ({
        ...prev,
        [comment.feature_request_id]: (prev[comment.feature_request_id] || []).filter(
          (c) => c.id !== comment.id
        )
      }));
      setCommentCounts((prev) => ({
        ...prev,
        [comment.feature_request_id]: Math.max(0, (prev[comment.feature_request_id] || 1) - 1)
      }));

      // Check if the user still has comments on this feature
      const remainingUserComments = comments[comment.feature_request_id]?.filter(
        (c) => c.id !== comment.id && c.user_id === userProfile.id
      );

      if (!remainingUserComments?.length) {
        // Remove from userComments if this was the last comment by the user
        const newUserComments = { ...userComments };
        delete newUserComments[comment.feature_request_id];
        setUserComments(newUserComments);
      }

      setStatusMessage({ type: 'success', message: 'Comment deleted successfully' });
      setTimeout(() => {
        setStatusMessage({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setStatusMessage({ type: 'error', message: 'Failed to delete comment' });
    }
  };

  const toggleExpandFeature = async (featureId) => {
    if (expandedFeature === featureId) {
      setExpandedFeature(null);
    } else {
      setExpandedFeature(featureId);
      if (!comments[featureId]) {
        await fetchComments(featureId);
      }
    }
  };

  const handleMoveToRoadmap = (feature) => {
    setFeatureToMove(feature);
    setShowMoveToRoadmapModal(true);
  };

  const canUserEditFeature = (feature) => {
    return userProfile && (feature.user_id === userProfile.id || isTechnician());
  };

  const canUserEditComment = (comment) => {
    return userProfile && (comment.user_id === userProfile.id || isTechnician());
  };

  const canMoveToRoadmap = (feature) => {
    return userProfile && isTechnician();
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':return 'text-red-600';
      case 'developer':return 'text-blue-600';
      case 'user':return 'text-green-600';
      default:return 'text-gray-600';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'requested':return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'under_review':return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'planned':return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'in_progress':return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed':return 'bg-green-100 text-green-800 border-green-200';
      case 'declined':return 'bg-red-100 text-red-800 border-red-200';
      default:return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':return 'bg-red-100 text-red-800 border-red-200';
      case 'high':return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':return 'bg-green-100 text-green-800 border-green-200';
      default:return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status) => {
    return status.
    replace('_', ' ').
    replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Helper function to get display name with proper fallback
  const getDisplayName = (feature) => {
    if (
    feature.user_nickname &&
    typeof feature.user_nickname === 'string' &&
    feature.user_nickname.trim() !== '')
    {
      return feature.user_nickname;
    }
    if (
    feature.user_full_name &&
    typeof feature.user_full_name === 'string' &&
    feature.user_full_name.trim() !== '')
    {
      return feature.user_full_name;
    }
    return 'Anonymous';
  };

  // Filter and sort features
  const filteredFeatures = features.
  filter((feature) => {
    const matchesSearch =
    feature.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feature.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || feature.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || feature.priority === priorityFilter;

    // Filter for user's content
    let matchesUserFilter = true;
    if (userProfile && userFilter === 'My Posts') {
      matchesUserFilter = feature.user_id === userProfile.id;
    } else if (userProfile && userFilter === 'My Comments') {
      matchesUserFilter = !!userComments[feature.id];
    }

    return matchesSearch && matchesStatus && matchesPriority && matchesUserFilter;
  }).
  sort((a, b) => {
    if (sortBy === 'votes') {
      return (votes.counts[b.id] || 0) - (votes.counts[a.id] || 0);
    } else if (sortBy === 'created_at') {
      return new Date(b.created_at) - new Date(a.created_at);
    } else if (sortBy === 'priority') {
      const priorityOrder = { 'critical': 3, 'high': 2, 'medium': 1, 'low': 0 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return 0;
  });

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
                onClick={() => handleDeleteComment(comment)}
                className="text-gray-400 hover:text-red-600">

                  <SafeIcon icon={FiTrash2} className="text-sm" />
                </button>
              </div>
            }
          </div>
          <div className="text-sm text-gray-700">
            {renderWithMentions(comment.text)}
          </div>
          {comment.attachments && comment.attachments.length > 0 &&
          <div className="mt-3">
              <AttachmentViewer files={comment.attachments} compact />
            </div>
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
          <p className="text-gray-600">Loading feature requests...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Feature Requests</h1>
            <p className="text-gray-600">Share and vote on new features for MGG™</p>
          </div>
          
          {/* Added back a single Request Feature button */}
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg inline-flex items-center space-x-2 shadow-sm">
            <SafeIcon icon={FiPlus} />
            <span>Request Feature</span>
          </button>
        </motion.div>

        {/* Status Message */}
        {statusMessage.message &&
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg mb-6 flex items-center space-x-2 ${
          statusMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`
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
        {showForm &&
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6 mb-8">

            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <SafeIcon icon={FiStar} className="mr-2 text-blue-600" />
              {editingFeature ? 'Edit Feature Request' : 'Create New Feature Request'}
            </h2>
            <form onSubmit={handleSubmitFeature} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feature Title *
                </label>
                <input
                type="text"
                value={form.title}
                onChange={(e) => {
                  setForm({ ...form, title: e.target.value });
                  if (formErrors.title) setFormErrors({ ...formErrors, title: '' });
                }}
                placeholder="Enter a descriptive title for your feature request"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                formErrors.title ? 'border-red-300' : 'border-gray-300'}`
                }
                disabled={formSubmitting} />

                {formErrors.title &&
              <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
              }
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <div className="relative">
                  <DisplayMentionsTextarea
                  value={form.description}
                  onChange={(e) => {
                    setForm({ ...form, description: e.target.value });
                    if (formErrors.description) setFormErrors({ ...formErrors, description: '' });
                  }}
                  placeholder="Please describe the feature in detail, including why it would be valuable (Type @ to mention users)"
                  minRows={8}
                  className={`${
                  formErrors.description ? 'border-red-300' : 'border-gray-300'} font-mono`
                  }
                  disabled={formSubmitting} />
                </div>
                {formErrors.description &&
              <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
              }
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
                disabled={formSubmitting}
                compact />

              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={formSubmitting}>

                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="UI, Performance, etc. (comma-separated)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={formSubmitting} />

                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingFeature(null);
                  setForm({ title: '', description: '', priority: 'medium', tags: '' });
                  setFormAttachments([]);
                  setFormErrors({});
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={formSubmitting}>

                  Cancel
                </button>
                <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg flex items-center space-x-2 shadow-sm"
                disabled={formSubmitting}>

                  {formSubmitting ?
                <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
                      <span>Submitting...</span>
                    </> :

                <>
                      <SafeIcon icon={FiStar} />
                      <span>{editingFeature ? 'Update Request' : 'Submit Request'}</span>
                    </>
                }
                </button>
              </div>
            </form>
          </motion.div>
        }

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <SafeIcon icon={FiSearch} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search feature requests by title or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />

            </div>
            <div className="flex space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">

                <option value="votes">Most Voted</option>
                <option value="created_at">Newest</option>
                <option value="priority">Priority</option>
              </select>
            </div>
            {/* User Filter - New */}
            {userProfile &&
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">

                <option value="All">All Features</option>
                <option value="My Posts">My Feature Requests</option>
                <option value="My Comments">Features I Commented On</option>
              </select>
            }
            <div className="flex items-center justify-center bg-gray-50 rounded-lg px-4 py-2">
              <span className="text-sm text-gray-600">
                {filteredFeatures.length} of {features.length} features
              </span>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="space-y-4">
          {filteredFeatures.map((feature, index) =>
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-gray-100">

              {/* Feature Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <SafeIcon icon={FiStar} className="text-blue-600" />
                      <h3
                      className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
                      onClick={() => toggleExpandFeature(feature.id)}>

                        {feature.title}
                      </h3>
                      <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        feature.status
                      )}`}>

                        {formatStatus(feature.status)}
                      </span>
                      <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                        feature.priority
                      )}`}>

                        {feature.priority.charAt(0).toUpperCase() + feature.priority.slice(1)}
                      </span>
                      
                      {/* Show indicator if user commented on this feature */}
                      {userProfile && userComments[feature.id] &&
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium border border-blue-200 flex items-center">
                          <SafeIcon icon={FiMessageCircle} className="mr-1" />
                          <span>You commented</span>
                        </span>
                    }
                      
                      {/* Show indicator if user is the creator */}
                      {userProfile && feature.user_id === userProfile.id &&
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium border border-purple-200 flex items-center">
                          <SafeIcon icon={FiUser} className="mr-1" />
                          <span>Your request</span>
                        </span>
                    }
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-sm mb-3 border border-gray-200 whitespace-pre-wrap line-clamp-2">
                      {renderWithMentions(feature.description)}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <span>
                        By {getDisplayName(feature)}
                      </span>
                      <span className="mx-2">•</span>
                      <span>
                        {format(new Date(feature.created_at), 'MMM dd, yyyy')}
                      </span>
                      {feature.attachments && feature.attachments.length > 0 &&
                    <>
                          <span className="mx-2">•</span>
                          <div className="flex items-center">
                            <SafeIcon icon={FiPaperclip} className="text-gray-400 mr-1" />
                            <span>{feature.attachments.length} file{feature.attachments.length !== 1 ? 's' : ''}</span>
                          </div>
                        </>
                    }
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 ml-4">
                    <button
                    onClick={() => handleVote(feature.id)}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                    votes.userVotes?.[feature.id] ?
                    'bg-blue-100 text-blue-700 border border-blue-200' :
                    'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`
                    }
                    title={votes.userVotes?.[feature.id] ? 'Remove vote' : 'Vote for this feature'}>

                      <SafeIcon icon={FiThumbsUp} className="text-sm" />
                      <span className="font-medium">{votes.counts?.[feature.id] || 0}</span>
                    </button>

                    <button
                    onClick={() => toggleExpandFeature(feature.id)}
                    className="flex items-center space-x-1 text-gray-500 hover:text-blue-600">

                      <SafeIcon icon={FiMessageCircle} className="text-sm" />
                      <span className="text-sm">
                        {commentCounts[feature.id] !== undefined ? commentCounts[feature.id] : 0} Comments
                      </span>
                    </button>

                    <button
                    onClick={() => toggleExpandFeature(feature.id)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title={expandedFeature === feature.id ? 'Collapse' : 'Expand'}>

                      <SafeIcon icon={expandedFeature === feature.id ? FiChevronUp : FiChevronDown} />
                    </button>

                    {/* Move to Roadmap Button for admins/developers */}
                    {canMoveToRoadmap(feature) &&
                  <button
                    onClick={() => handleMoveToRoadmap(feature)}
                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Move to Roadmap">

                        <SafeIcon icon={FiMap} />
                      </button>
                  }

                    {canUserEditFeature(feature) &&
                  <>
                        <button
                      onClick={() => handleEditFeature(feature)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit feature">

                          <SafeIcon icon={FiEdit3} />
                        </button>
                        <button
                      onClick={() => handleDeleteFeature(feature.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete feature">

                          <SafeIcon icon={FiTrash2} />
                        </button>
                      </>
                  }
                  </div>
                </div>

                {/* Tags */}
                {feature.tags && feature.tags.length > 0 &&
              <div className="flex flex-wrap gap-2">
                    {feature.tags.map((tag, index) =>
                <span
                  key={index}
                  className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs">

                        {tag}
                      </span>
                )}
                  </div>
              }
              </div>

              {/* Expanded Content - Comments Section */}
              {expandedFeature === feature.id &&
            <div className="p-6 bg-gray-50 border-t border-gray-100">
                  <div className="mb-4">
                    <p className="text-gray-700 whitespace-pre-wrap font-mono">
                      {renderWithMentions(feature.description)}
                    </p>
                  </div>

                  {/* Feature Attachments */}
                  {feature.attachments && feature.attachments.length > 0 &&
              <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <SafeIcon icon={FiPaperclip} className="mr-2 text-gray-500" />
                        Attachments
                      </h4>
                      <AttachmentViewer files={feature.attachments} />
                    </div>
              }

                  <div className="mt-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <SafeIcon icon={FiMessageCircle} className="mr-2 text-blue-600" />
                      <span>Comments ({comments[feature.id]?.length || 0})</span>
                    </h4>

                    {/* Comments List */}
                    <div className="space-y-4 max-h-96 overflow-y-auto mb-6 p-1">
                      {loadingComments[feature.id] ?
                  <div className="flex justify-center py-4">
                          <SafeIcon icon={FiLoader} className="text-blue-600 animate-spin" />
                          <span className="ml-2 text-gray-600">Loading comments...</span>
                        </div> :

                  <>
                          {(comments[feature.id] || []).length > 0 ?
                    (comments[feature.id] || []).map((comment) =>
                    <CommentItem key={comment.id} comment={comment} />
                    ) :

                    <p className="text-center text-gray-500 py-4">
                              No comments yet. Be the first to comment!
                            </p>
                    }
                        </>
                  }
                      <div ref={commentsEndRef} />
                    </div>

                    {/* Add Comment */}
                    {userProfile ?
                <div className="space-y-3">
                        <DisplayMentionsTextarea
                          value={newComment[feature.id] || ''}
                          onChange={(e) => setNewComment({ ...newComment, [feature.id]: e.target.value })}
                          placeholder="Add a comment... (Type @ to mention users)"
                          minRows={3}
                          disabled={commentLoading}
                        />

                        <FileUpload
                          onFilesUploaded={setCommentAttachments}
                          existingFiles={commentAttachments}
                          maxFiles={2}
                          disabled={commentLoading}
                          compact
                        />

                        <div className="flex justify-end">
                          <button
                            onClick={() => handleAddComment(feature.id)}
                            disabled={!newComment[feature.id]?.trim() || commentLoading}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-sm"
                          >
                            {commentLoading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <SafeIcon icon={FiSend} />
                            )}
                            <span>Submit</span>
                          </button>
                        </div>
                      </div> :

                <p className="text-center text-gray-500 py-2">
                        Please sign in to add comments.
                      </p>
                }
                  </div>
                </div>
            }
            </motion.div>
          )}

          {filteredFeatures.length === 0 &&
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-md p-8 text-center">

              <SafeIcon icon={FiStar} className="text-gray-300 text-6xl mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No feature requests found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'All' || priorityFilter !== 'All' || userFilter !== 'All' ?
              'Try adjusting your search or filters' :
              'There are no feature requests yet.'}
              </p>
            </motion.div>
          }
        </div>
      </div>

      {/* Move to Roadmap Modal */}
      {showMoveToRoadmapModal && featureToMove &&
      <MoveToRoadmapModal
        feature={featureToMove}
        onClose={() => setShowMoveToRoadmapModal(false)}
        onSuccess={(roadmapItem) => {
          setShowMoveToRoadmapModal(false);
          // Update feature status to reflect it's been moved to roadmap
          const updatedFeatures = features.map((f) =>
          f.id === featureToMove.id ? { ...f, status: 'planned' } : f
          );
          setFeatures(updatedFeatures);
          setStatusMessage({ type: 'success', message: 'Feature successfully moved to roadmap!' });
          setTimeout(() => {
            setStatusMessage({ type: '', message: '' });
          }, 3000);
        }} />

      }
    </div>);

};

export default FeatureRequests;
