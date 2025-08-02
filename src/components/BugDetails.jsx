import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useMention } from '../contexts/MentionContext';
import SafeIcon from '../common/SafeIcon';
import Header from './Header';
import AttachmentViewer from './AttachmentViewer';
import FileUpload from './FileUpload';
import CommentWithMentions from './CommentWithMentions';
import CommentDisplay from './CommentDisplay';
import * as FiIcons from 'react-icons/fi';
import { format } from 'date-fns';
import supabase from '../lib/supabase';

const {
  FiArrowLeft,
  FiEdit3,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiLoader,
  FiMessageCircle,
  FiThumbsUp,
  FiPaperclip
} = FiIcons;

const BugDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile, isTechnician } = useAuth();
  const { processMentions, renderWithMentions } = useMention();
  const [bug, setBug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: '',
    severity: '',
    priority: '',
    assignee: ''
  });
  const [comments, setComments] = useState([]);
  const [commentAttachments, setCommentAttachments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });
  const [votes, setVotes] = useState({ count: 0, userVoted: false });
  const commentsEndRef = useRef(null);

  useEffect(() => {
    fetchBug();
  }, [id]);

  useEffect(() => {
    if (bug) {
      setEditForm({
        title: bug.title || '',
        description: bug.description || '',
        status: bug.status || 'Open',
        severity: bug.severity || 'Medium',
        priority: bug.priority || 'Medium',
        assignee: bug.assignee || ''
      });
      fetchComments();
      fetchVotes();
    }
  }, [bug]);

  useEffect(() => {
    if (commentsEndRef.current && comments.length > 0) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  const fetchBug = async () => {
    try {
      setLoading(true);
      // Use direct table query instead of view
      const { data: bugData, error: bugError } = await supabase
        .from('bugs_mgg2024')
        .select('*')
        .eq('id', id)
        .single();

      if (bugError) throw bugError;

      if (bugData) {
        // Get reporter details
        const { data: userData, error: userError } = await supabase
          .from('profiles_mgg_2024')
          .select('full_name, nickname, role')
          .eq('id', bugData.reporter_id)
          .single();

        if (userError) {
          console.warn('Error fetching reporter data:', userError);
          setBug({
            ...bugData,
            reporter_full_name: 'Unknown',
            reporter_nickname: 'User',
            reporter_role: 'user'
          });
        } else {
          setBug({
            ...bugData,
            reporter_full_name: userData?.full_name || 'Unknown',
            reporter_nickname: userData?.nickname || 'User',
            reporter_role: userData?.role || 'user'
          });
        }
      } else {
        setStatusMessage({ type: 'error', message: 'Bug not found' });
      }
    } catch (error) {
      console.error('Error fetching bug:', error);
      setStatusMessage({ type: 'error', message: 'Error loading bug details: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      // Fetch comments directly from table
      const { data: commentsData, error: commentsError } = await supabase
        .from('bug_comments_mgg2024')
        .select('*')
        .eq('bug_id', id)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Enhance comments with user data
      const enhancedComments = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: userData, error: userError } = await supabase
            .from('profiles_mgg_2024')
            .select('full_name, nickname, role')
            .eq('id', comment.user_id)
            .single();

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

      setComments(enhancedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchVotes = async () => {
    try {
      // Get total vote count
      const { data: votesData, error: votesError } = await supabase
        .from('bug_votes_mgg2024')
        .select('*')
        .eq('bug_id', id);

      if (votesError) throw votesError;

      // Check if current user has voted
      const userVoted = userProfile && votesData?.some((vote) => vote.user_id === userProfile.id);

      setVotes({
        count: votesData?.length || 0,
        userVoted
      });
    } catch (error) {
      console.error('Error fetching votes:', error);
    }
  };

  const handleUpdateBug = async () => {
    try {
      if (!editForm.title.trim() || !editForm.description.trim()) {
        setStatusMessage({ type: 'error', message: 'Title and description are required' });
        return;
      }

      const { data, error } = await supabase
        .from('bugs_mgg2024')
        .update({
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          status: editForm.status,
          severity: editForm.severity,
          priority: editForm.priority,
          assignee: editForm.assignee || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) throw error;

      // Process mentions in the updated description
      if (editForm.description.trim() && processMentions) {
        processMentions(editForm.description.trim(), 'bug', id);
      }

      // Update local state with updated bug
      setBug({ ...bug, ...data[0] });
      setStatusMessage({ type: 'success', message: 'Bug updated successfully' });
      setEditing(false);

      // Clear status message after a delay
      setTimeout(() => {
        setStatusMessage({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error updating bug:', error);
      setStatusMessage({ type: 'error', message: 'Failed to update bug: ' + error.message });
    }
  };

  const handleDeleteBug = async () => {
    if (!window.confirm('Are you sure you want to delete this bug report?')) return;

    try {
      const { error } = await supabase
        .from('bugs_mgg2024')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setStatusMessage({ type: 'success', message: 'Bug deleted successfully' });

      // Navigate back to bugs list after a short delay
      setTimeout(() => {
        navigate('/bugs');
      }, 1500);
    } catch (error) {
      console.error('Error deleting bug:', error);
      setStatusMessage({ type: 'error', message: 'Failed to delete bug: ' + error.message });
    }
  };

  const handleAddComment = async (text) => {
    if (!text.trim() && commentAttachments.length === 0) return;
    if (!userProfile) return;

    console.log("🐛 BugDetails handleAddComment called with:", {
      text,
      bugId: id,
      hasAttachments: commentAttachments.length > 0
    });

    setCommentLoading(true);

    try {
      const commentData = {
        bug_id: id,
        text: text.trim(),
        user_id: userProfile.id,
        attachments: commentAttachments
      };

      const { data, error } = await supabase
        .from('bug_comments_mgg2024')
        .insert([commentData])
        .select();

      if (error) throw error;

      console.log("✅ Comment inserted successfully:", data[0]);

      // NOTE: Mentions are already processed in CommentWithMentions component
      // before this function is called, so we don't need to process them again here

      // Get user data to enhance the comment
      const { data: userData, error: userError } = await supabase
        .from('profiles_mgg_2024')
        .select('full_name, nickname, role')
        .eq('id', userProfile.id)
        .single();

      if (userError) throw userError;

      const newComment = {
        ...data[0],
        user_full_name: userData?.full_name || 'Unknown',
        user_nickname: userData?.nickname || 'User',
        user_role: userData?.role || 'user'
      };

      setComments([...comments, newComment]);
      setCommentAttachments([]);
    } catch (error) {
      console.error('Error adding comment:', error);
      setStatusMessage({ type: 'error', message: 'Failed to add comment: ' + error.message });
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (comment) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('bug_comments_mgg2024')
        .delete()
        .eq('id', comment.id);

      if (error) throw error;

      setComments(comments.filter((c) => c.id !== comment.id));
      setStatusMessage({ type: 'success', message: 'Comment deleted successfully' });

      // Clear status message after a delay
      setTimeout(() => {
        setStatusMessage({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setStatusMessage({ type: 'error', message: 'Failed to delete comment: ' + error.message });
    }
  };

  const handleVote = async () => {
    if (!userProfile) {
      setStatusMessage({ type: 'error', message: 'You must be logged in to vote' });
      return;
    }

    try {
      if (votes.userVoted) {
        // Remove vote
        const { error } = await supabase
          .from('bug_votes_mgg2024')
          .delete()
          .eq('bug_id', id)
          .eq('user_id', userProfile.id);

        if (error) throw error;

        setVotes({
          count: Math.max(0, votes.count - 1),
          userVoted: false
        });
      } else {
        // Add vote
        const { error } = await supabase
          .from('bug_votes_mgg2024')
          .insert([{
            bug_id: id,
            user_id: userProfile.id,
            vote_type: 'upvote'
          }]);

        if (error) throw error;

        setVotes({
          count: votes.count + 1,
          userVoted: true
        });
      }
    } catch (error) {
      console.error('Error voting on bug:', error);
      setStatusMessage({ type: 'error', message: 'Failed to update vote: ' + error.message });
    }
  };

  const canEdit = () => {
    return userProfile && (isTechnician() || bug?.reporter_id === userProfile.id);
  };

  const canDelete = () => {
    return userProfile && (isTechnician() || bug?.reporter_id === userProfile.id);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-red-100 text-red-800 border-red-200';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'Closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Helper function to get display name with proper fallback
  const getDisplayName = (obj) => {
    if (obj?.user_nickname && typeof obj.user_nickname === 'string' && obj.user_nickname.trim() !== '') {
      return obj.user_nickname;
    }
    if (obj?.user_full_name && typeof obj.user_full_name === 'string' && obj.user_full_name.trim() !== '') {
      return obj.user_full_name;
    }
    return 'Anonymous';
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="p-6 text-center">
          <SafeIcon icon={FiLoader} className="text-blue-600 text-5xl mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading bug details...</p>
        </div>
      </div>
    );
  }

  if (!bug) {
    return (
      <div>
        <Header />
        <div className="p-6 text-center">
          <SafeIcon icon={FiAlertCircle} className="text-red-500 text-5xl mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bug Not Found</h1>
          <p className="text-gray-600 mb-4">The bug you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/bugs"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center"
          >
            <SafeIcon icon={FiArrowLeft} className="mr-2" />
            Back to Bug List
          </Link>
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
          className="flex items-start justify-between mb-6"
        >
          <div className="flex items-center space-x-4">
            <Link
              to="/bugs"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <SafeIcon icon={FiArrowLeft} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {editing ? 'Edit Bug' : 'Bug Details'}
              </h1>
              <p className="text-gray-600">
                Viewing details for bug #{id.substring(0, 8)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!editing && canEdit() && (
              <button
                onClick={() => setEditing(true)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit Bug"
              >
                <SafeIcon icon={FiEdit3} />
              </button>
            )}
            {canDelete() && (
              <button
                onClick={handleDeleteBug}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Bug"
              >
                <SafeIcon icon={FiTrash2} />
              </button>
            )}
          </div>
        </motion.div>

        {/* Status Message */}
        {statusMessage.message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg mb-6 flex items-center space-x-2 ${
              statusMessage.type === 'success' 
                ? 'bg-green-50 text-green-700' 
                : 'bg-red-50 text-red-700'
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

        {/* Bug Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              {editing ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bug Title *
                    </label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={8}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">{bug.title}</h2>
                    <button
                      onClick={handleVote}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                        votes.userVoted
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                      title={votes.userVoted ? 'Remove vote' : 'Upvote this bug'}
                    >
                      <SafeIcon icon={FiThumbsUp} className="text-sm" />
                      <span className="text-sm font-medium">{votes.count}</span>
                    </button>
                  </div>
                  <div className="prose max-w-none mb-6">
                    <CommentWithMentions content={bug.description} className="text-gray-700 whitespace-pre-wrap" />
                  </div>
                  {/* Bug Attachments */}
                  {bug.attachments && bug.attachments.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                        <SafeIcon icon={FiPaperclip} className="mr-2 text-gray-500" />
                        Attachments
                      </h3>
                      <AttachmentViewer files={bug.attachments} />
                    </div>
                  )}
                </>
              )}
            </motion.div>

            {/* Comments Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <SafeIcon icon={FiMessageCircle} className="mr-2 text-blue-600" />
                <span>Comments ({comments.length})</span>
              </h3>

              {/* Comments List */}
              <div className="space-y-4 mb-6">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <CommentDisplay
                      key={comment.id}
                      comment={comment}
                      canDelete={userProfile && (comment.user_id === userProfile.id || isTechnician())}
                      onDelete={handleDeleteComment}
                    />
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    No comments yet. Be the first to comment!
                  </p>
                )}
                <div ref={commentsEndRef} />
              </div>

              {/* Add Comment Form */}
              {userProfile ? (
                <CommentWithMentions
                  onSubmit={handleAddComment}
                  loading={commentLoading}
                  attachments={commentAttachments}
                  setAttachments={setCommentAttachments}
                  contentType="bug_comment"
                  contentId={id}
                />
              ) : (
                <p className="text-center text-gray-500 py-2">
                  Please sign in to add comments.
                </p>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Bug Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">Status</h3>
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Severity
                    </label>
                    <select
                      value={editForm.severity}
                      onChange={(e) => setEditForm({ ...editForm, severity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={editForm.priority}
                      onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(bug.status)}`}>
                      {bug.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Severity</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(bug.severity)}`}>
                      {bug.severity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Priority</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(bug.priority)}`}>
                      {bug.priority}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Assignment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment</h3>
              {editing ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignee
                  </label>
                  <input
                    type="text"
                    value={editForm.assignee || ''}
                    onChange={(e) => setEditForm({ ...editForm, assignee: e.target.value })}
                    placeholder="Enter assignee name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Assignee</span>
                  <span className="text-sm font-medium">
                    {bug.assignee || 'Unassigned'}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Reporter Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reporter</h3>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {bug.reporter_nickname?.[0] || bug.reporter_full_name?.[0] || 'U'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {bug.reporter_nickname || bug.reporter_full_name || 'Anonymous'}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {bug.reporter_role || 'user'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Dates */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="text-sm">
                    {format(new Date(bug.created_at), 'MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm">
                    {format(new Date(bug.updated_at), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Tags */}
            {bug.tags && bug.tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {bug.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            {editing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="flex flex-col space-y-3"
              >
                <button
                  onClick={handleUpdateBug}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <SafeIcon icon={FiCheckCircle} />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <SafeIcon icon={FiX} />
                  <span>Cancel</span>
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BugDetails;