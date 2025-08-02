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
import AssigneeAutocomplete from './AssigneeAutocomplete';
import CommentWithMentions from './CommentWithMentions';
import * as FiIcons from 'react-icons/fi';
import { format } from 'date-fns';
import supabase from '../lib/supabase';

const {
  FiMap,
  FiPlus,
  FiCalendar,
  FiEdit3,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiLoader,
  FiTag,
  FiClock,
  FiTrendingUp,
  FiTarget,
  FiSearch,
  FiFilter,
  FiMessageCircle,
  FiSend,
  FiChevronDown,
  FiChevronUp,
  FiThumbsUp,
  FiPaperclip
} = FiIcons;

const Roadmap = () => {
  const { userProfile, isAdmin, isTechnician } = useAuth();
  const { processMentions, renderWithMentions } = useMention();
  const [roadmapItems, setRoadmapItems] = useState([]);
  const [expandedItem, setExpandedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [quarterFilter, setQuarterFilter] = useState('All');
  const [sortBy, setSortBy] = useState('created_at');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    quarter: 'Q1 2024',
    estimatedCompletion: '',
    assignee: '',
    tags: ''
  });
  const [formAttachments, setFormAttachments] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState('');
  const [commentAttachments, setCommentAttachments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [votes, setVotes] = useState({});
  const commentsEndRef = useRef(null);
  const [availableQuarters, setAvailableQuarters] = useState([]);

  useEffect(() => {
    fetchRoadmapItems();
    generateQuarterOptions();
  }, []);

  useEffect(() => {
    if (expandedItem) {
      fetchComments(expandedItem);
      fetchVotes();
    }
  }, [expandedItem]);

  useEffect(() => {
    if (expandedItem && comments[expandedItem]?.length > 0) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, expandedItem]);

  // Generate quarter options dynamically based on current date
  const generateQuarterOptions = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;

    // Generate 8 quarters starting from current quarter
    const quarters = [];
    let year = currentYear;
    let quarter = currentQuarter;
    for (let i = 0; i < 8; i++) {
      quarters.push(`Q${quarter} ${year}`);
      quarter++;
      if (quarter > 4) {
        quarter = 1;
        year++;
      }
    }

    // Add 'Future' option
    quarters.push('Future');

    setAvailableQuarters(quarters);

    // Set default quarter in form to current quarter
    setForm((prev) => ({
      ...prev,
      quarter: `Q${currentQuarter} ${currentYear}`
    }));
  };

  const fetchRoadmapItems = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.
      from('roadmap_items_mgg2024').
      select('*').
      order('created_at', { ascending: false });

      if (error) throw error;

      setRoadmapItems(data || []);
      await fetchVotes();
    } catch (error) {
      console.error('Error fetching roadmap items:', error);
      setStatusMessage({ type: 'error', message: 'Failed to load roadmap items: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (itemId) => {
    try {
      const { data, error } = await supabase.
      from('roadmap_comments_mgg2024').
      select('*').
      eq('roadmap_item_id', itemId).
      order('created_at', { ascending: true });

      if (error) throw error;

      setComments((prev) => ({ ...prev, [itemId]: data || [] }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchVotes = async () => {
    try {
      const { data, error } = await supabase.
      from('roadmap_votes_mgg2024').
      select('*');

      if (error) throw error;

      const voteCounts = {};
      const userVotes = {};

      data?.forEach((vote) => {
        voteCounts[vote.roadmap_item_id] = (voteCounts[vote.roadmap_item_id] || 0) + 1;
        if (vote.user_id === userProfile?.id) {
          userVotes[vote.roadmap_item_id] = true;
        }
      });

      setVotes({ counts: voteCounts, userVotes: userVotes });
    } catch (error) {
      console.error('Error fetching votes:', error);
    }
  };

  const handleFormChange = (field, value) => {
    setForm({ ...form, [field]: value });
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: '' });
    }
  };

  const resetForm = () => {
    const currentDate = new Date();
    const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;
    const currentYear = currentDate.getFullYear();

    setForm({
      title: '',
      description: '',
      status: 'planning',
      priority: 'medium',
      quarter: `Q${currentQuarter} ${currentYear}`,
      estimatedCompletion: '',
      assignee: '',
      tags: ''
    });
    setFormAttachments([]);
    setEditingItem(null);
    setFormErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const errors = {};
    if (!form.title.trim()) errors.title = 'Title is required';
    if (!form.description.trim()) errors.description = 'Description is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (!userProfile) {
      setStatusMessage({ type: 'error', message: 'You must be logged in to manage roadmap items' });
      return;
    }

    if (!isTechnician()) {
      setStatusMessage({ type: 'error', message: 'You need developer or admin privileges to manage roadmap items' });
      return;
    }

    setFormSubmitting(true);

    try {
      const tagsArray = form.tags ?
      form.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0) :
      [];

      const roadmapData = {
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        quarter: form.quarter,
        estimated_completion: form.estimatedCompletion || null,
        assignee: form.assignee || null,
        tags: tagsArray,
        attachments: formAttachments
      };

      if (editingItem) {
        // Update existing item
        const { data, error } = await supabase.
        from('roadmap_items_mgg2024').
        update(roadmapData).
        eq('id', editingItem.id).
        select();

        if (error) throw error;

        setRoadmapItems(roadmapItems.map((item) =>
        item.id === editingItem.id ? { ...item, ...roadmapData } : item
        ));

        setStatusMessage({ type: 'success', message: 'Roadmap item updated successfully!' });
      } else {
        // Create new item
        const { data, error } = await supabase.
        from('roadmap_items_mgg2024').
        insert([roadmapData]).
        select();

        if (error) throw error;

        setRoadmapItems([data[0], ...roadmapItems]);
        setStatusMessage({ type: 'success', message: 'Roadmap item created successfully!' });
      }

      // Process mentions in the description
      if (form.description.trim()) {
        processMentions(form.description.trim(), 'roadmap', editingItem?.id || roadmapItems[0]?.id);
      }

      resetForm();
      setShowForm(false);

      setTimeout(() => {
        setStatusMessage({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error saving roadmap item:', error);
      setStatusMessage({ type: 'error', message: 'Failed to save roadmap item: ' + error.message });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      description: item.description,
      status: item.status,
      priority: item.priority,
      quarter: item.quarter,
      estimatedCompletion: item.estimated_completion || '',
      assignee: item.assignee || '',
      tags: item.tags ? item.tags.join(',') : ''
    });
    setFormAttachments(item.attachments || []);
    setShowForm(true);
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this roadmap item?')) return;

    try {
      const { error } = await supabase.
      from('roadmap_items_mgg2024').
      delete().
      eq('id', itemId);

      if (error) throw error;

      setRoadmapItems((prev) => prev.filter((item) => item.id !== itemId));
      setStatusMessage({ type: 'success', message: 'Roadmap item deleted successfully' });

      setTimeout(() => {
        setStatusMessage({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error deleting roadmap item:', error);
      setStatusMessage({ type: 'error', message: 'Failed to delete roadmap item: ' + error.message });
    }
  };

  const handleVote = async (itemId) => {
    if (!userProfile) {
      setStatusMessage({ type: 'error', message: 'You must be logged in to vote' });
      return;
    }

    try {
      const hasVoted = votes.userVotes?.[itemId];

      if (hasVoted) {
        // Remove vote
        const { error } = await supabase.
        from('roadmap_votes_mgg2024').
        delete().
        eq('roadmap_item_id', itemId).
        eq('user_id', userProfile.id);

        if (error) throw error;

        setVotes((prev) => ({
          counts: { ...prev.counts, [itemId]: Math.max(0, (prev.counts[itemId] || 0) - 1) },
          userVotes: { ...prev.userVotes, [itemId]: false }
        }));
      } else {
        // Add vote
        const { error } = await supabase.
        from('roadmap_votes_mgg2024').
        insert([{ roadmap_item_id: itemId, user_id: userProfile.id, vote_type: 'upvote' }]);

        if (error) throw error;

        setVotes((prev) => ({
          counts: { ...prev.counts, [itemId]: (prev.counts[itemId] || 0) + 1 },
          userVotes: { ...prev.userVotes, [itemId]: true }
        }));
      }
    } catch (error) {
      console.error('Error voting on roadmap item:', error);
      setStatusMessage({ type: 'error', message: 'Failed to update vote: ' + error.message });
    }
  };

  const handleAddComment = async (itemId) => {
    if (!commentText.trim() && commentAttachments.length === 0) return;

    if (!userProfile) {
      setStatusMessage({ type: 'error', message: 'You must be logged in to comment' });
      return;
    }

    setCommentLoading(true);

    try {
      const { data, error } = await supabase.
      from('roadmap_comments_mgg2024').
      insert([{
        roadmap_item_id: itemId,
        text: commentText.trim(),
        user_id: userProfile.id,
        attachments: commentAttachments
      }]).
      select();

      if (error) throw error;

      // Process mentions in the comment
      if (commentText.trim()) {
        processMentions(commentText.trim(), 'roadmap_comment', itemId);
      }

      setComments((prev) => ({ ...prev, [itemId]: [...(prev[itemId] || []), data[0]] }));
      setCommentText('');
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
      const { error } = await supabase.
      from('roadmap_comments_mgg2024').
      delete().
      eq('id', comment.id);

      if (error) throw error;

      setComments((prev) => ({
        ...prev,
        [comment.roadmap_item_id]: (prev[comment.roadmap_item_id] || []).filter((c) => c.id !== comment.id)
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

  const toggleExpandItem = (itemId) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'planning':return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress':return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':return 'bg-green-100 text-green-800 border-green-200';
      case 'delayed':return 'bg-red-100 text-red-800 border-red-200';
      default:return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':return 'bg-green-100 text-green-800 border-green-200';
      default:return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status) => {
    return status.
    replace('-', ' ').
    replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Get unique quarters for filter
  const uniqueQuarters = [...new Set(roadmapItems.map((item) => item.quarter))].sort();

  // Filter and sort roadmap items
  const filteredItems = roadmapItems.
  filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || item.priority === priorityFilter;
    const matchesQuarter = quarterFilter === 'All' || item.quarter === quarterFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesQuarter;
  }).
  sort((a, b) => {
    if (sortBy === 'votes') {
      return (votes.counts[b.id] || 0) - (votes.counts[a.id] || 0);
    } else if (sortBy === 'created_at') {
      return new Date(b.created_at) - new Date(a.created_at);
    } else if (sortBy === 'priority') {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    } else if (sortBy === 'quarter') {
      return a.quarter.localeCompare(b.quarter);
    }
    return 0;
  });

  return (
    <div>
      <Header />
      <div className="p-4 sm:p-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">MGG™ Roadmap</h1>
            <p className="text-gray-600">Future plans and development timeline for Make Greta Great</p>
          </div>
          {isTechnician() &&
          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors">

              <SafeIcon icon={FiPlus} />
              <span>Add Roadmap Item</span>
            </button>
          }
        </motion.div>

        {/* Status Message */}
        {statusMessage.message &&
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg mb-6 flex items-center space-x-2 ${
          statusMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`
          }>

            <SafeIcon icon={statusMessage.type === 'success' ? FiCheckCircle : FiAlertCircle} className="flex-shrink-0" />
            <span>{statusMessage.message}</span>
            <button
            onClick={() => setStatusMessage({ type: '', message: '' })}
            className="ml-auto text-gray-500 hover:text-gray-700">

              <SafeIcon icon={FiX} />
            </button>
          </motion.div>
        }

        {/* Add/Edit Form */}
        {showForm &&
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-8">

            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingItem ? 'Edit Roadmap Item' : 'Add New Roadmap Item'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                type="text"
                value={form.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                formErrors.title ? 'border-red-300' : 'border-gray-300'}`
                }
                placeholder="Feature or milestone title"
                disabled={formSubmitting} />

                {formErrors.title &&
              <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
              }
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <div className="relative">
                  <DisplayMentionsTextarea
                    value={form.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    minRows={4}
                    placeholder="Detailed description of this roadmap item (Type @ to mention users)"
                    className={`${formErrors.description ? 'border-red-300' : 'border-gray-300'} focus:ring-blue-500`}
                    disabled={formSubmitting}
                  />
                </div>
                {formErrors.description &&
              <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
              }
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
                <FileUpload
                onFilesUploaded={setFormAttachments}
                existingFiles={formAttachments}
                maxFiles={3}
                disabled={formSubmitting}
                compact />

              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                  value={form.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={formSubmitting}>

                    <option value="planning">Planning</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="delayed">Delayed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority *
                  </label>
                  <select
                  value={form.priority}
                  onChange={(e) => handleFormChange('priority', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={formSubmitting}>

                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quarter *
                  </label>
                  <select
                  value={form.quarter}
                  onChange={(e) => handleFormChange('quarter', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={formSubmitting}>

                    {availableQuarters.map((quarter) =>
                  <option key={quarter} value={quarter}>{quarter}</option>
                  )}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Completion
                  </label>
                  <input
                  type="date"
                  value={form.estimatedCompletion}
                  onChange={(e) => handleFormChange('estimatedCompletion', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={formSubmitting} />

                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignee
                  </label>
                  <AssigneeAutocomplete
                  value={form.assignee}
                  onChange={(value) => handleFormChange('assignee', value)}
                  placeholder="Person responsible"
                  disabled={formSubmitting} />

                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => handleFormChange('tags', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="UI,Performance,Backend,etc. (comma-separated)"
                  disabled={formSubmitting} />

                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={formSubmitting}>

                  Cancel
                </button>
                <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                disabled={formSubmitting}>

                  {formSubmitting ?
                <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white" />
                      <span>{editingItem ? 'Updating...' : 'Creating...'}</span>
                    </> :

                <>
                      <SafeIcon icon={FiCheckCircle} />
                      <span>{editingItem ? 'Update' : 'Create'}</span>
                    </>
                }
                </button>
              </div>
            </form>
          </motion.div>
        }

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative">
              <SafeIcon icon={FiSearch} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search roadmap..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />

            </div>
            
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">

                <option value="All">All Statuses</option>
                <option value="planning">Planning</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="delayed">Delayed</option>
              </select>
            </div>
            
            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">

                <option value="All">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            
            <div>
              <select
                value={quarterFilter}
                onChange={(e) => setQuarterFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">

                <option value="All">All Quarters</option>
                {uniqueQuarters.map((quarter) =>
                <option key={quarter} value={quarter}>{quarter}</option>
                )}
              </select>
            </div>
            
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">

                <option value="created_at">Newest First</option>
                <option value="votes">Most Voted</option>
                <option value="priority">Priority</option>
                <option value="quarter">Quarter</option>
              </select>
            </div>
            
            <div className="flex items-center justify-center bg-gray-50 rounded-lg px-4 py-2">
              <span className="text-sm text-gray-600">
                {filteredItems.length} of {roadmapItems.length} items
              </span>
            </div>
          </div>
        </motion.div>

        {/* Roadmap Items */}
        {loading ?
        <div className="flex items-center justify-center py-12">
            <SafeIcon icon={FiLoader} className="text-blue-600 text-4xl animate-spin" />
            <span className="ml-3 text-gray-600">Loading roadmap...</span>
          </div> :
        filteredItems.length > 0 ?
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4 sm:space-y-6">

            {filteredItems.map((item) =>
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">

                {/* Item Header */}
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center space-x-3 mb-2">
                        <h3
                      className="text-lg sm:text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
                      onClick={() => toggleExpandItem(item.id)}>

                          {item.title}
                        </h3>
                        <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        item.status
                      )}`}>

                          {formatStatus(item.status)}
                        </span>
                        <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                        item.priority
                      )}`}>

                          {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                        </span>
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                          {item.quarter}
                        </span>
                      </div>
                      <CommentWithMentions 
                        content={item.description} 
                        className="text-gray-600 mb-3 line-clamp-2" 
                        maxLength={150} 
                      />
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                        <span>Created: {format(new Date(item.created_at), 'MMM dd, yyyy')}</span>
                        {item.assignee &&
                    <>
                            <span className="hidden sm:inline">•</span>
                            <span>Assignee: {item.assignee}</span>
                          </>
                    }
                        {item.estimated_completion &&
                    <>
                            <span className="hidden sm:inline">•</span>
                            <span>Target: {format(new Date(item.estimated_completion), 'MMM dd, yyyy')}</span>
                          </>
                    }
                        <span className="hidden sm:inline">•</span>
                        <span>{comments[item.id]?.length || 0} comments</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                    onClick={() => handleVote(item.id)}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                    votes.userVotes?.[item.id] ?
                    'bg-blue-100 text-blue-700 border border-blue-200' :
                    'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`
                    }
                    title={votes.userVotes?.[item.id] ? 'Remove vote' : 'Vote for this item'}>

                        <SafeIcon icon={FiThumbsUp} className="text-sm" />
                        <span className="font-medium">{votes.counts?.[item.id] || 0}</span>
                      </button>
                      <button
                    onClick={() => toggleExpandItem(item.id)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title={expandedItem === item.id ? 'Collapse' : 'Expand'}>

                        <SafeIcon icon={expandedItem === item.id ? FiChevronUp : FiChevronDown} />
                      </button>
                      {isTechnician() &&
                  <>
                          <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit item">

                            <SafeIcon icon={FiEdit3} />
                          </button>
                          <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete item">

                            <SafeIcon icon={FiTrash2} />
                          </button>
                        </>
                  }
                    </div>
                  </div>
                  {/* Tags */}
                  {item.tags && item.tags.length > 0 &&
              <div className="flex flex-wrap gap-2 mt-3">
                      {item.tags.map((tag, index) =>
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">

                          {tag}
                        </span>
                )}
                    </div>
              }
                </div>

                {/* Expanded Content */}
                {expandedItem === item.id &&
            <div className="border-t border-gray-200 p-4 sm:p-6">
                    <div className="mb-4">
                      <CommentWithMentions content={item.description} className="text-gray-700 whitespace-pre-wrap" />
                    </div>
                    
                    {/* Attachments */}
                    {item.attachments && item.attachments.length > 0 &&
              <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <SafeIcon icon={FiPaperclip} className="mr-2 text-gray-500" />
                          Attachments
                        </h4>
                        <AttachmentViewer files={item.attachments} />
                      </div>
              }
                    
                    <div className="mt-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <SafeIcon icon={FiMessageCircle} className="mr-2 text-blue-600" />
                        <span>Comments ({comments[item.id]?.length || 0})</span>
                      </h4>
                      
                      {/* Comments List */}
                      <div className="space-y-4 max-h-96 overflow-y-auto mb-6 p-1">
                        {comments[item.id]?.length > 0 ?
                  comments[item.id].map((comment) =>
                  <div
                    key={comment.id}
                    className="bg-gray-50 rounded-lg p-3 sm:p-4">

                              <div className="flex justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium text-blue-600">
                                      {comment.user_name?.[0] || 'U'}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {comment.user_name || 'Anonymous'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      <span className="capitalize">{comment.user_role || 'User'}</span> •{' '}
                                      {format(new Date(comment.created_at), 'MMM dd, yyyy HH:mm')}
                                    </p>
                                  </div>
                                </div>
                                {(comment.user_id === userProfile?.id || isTechnician()) &&
                      <button
                        onClick={() => handleDeleteComment(comment)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete Comment">

                                    <SafeIcon icon={FiTrash2} className="text-sm" />
                                  </button>
                      }
                              </div>
                              <div className="mt-2">
                                <CommentWithMentions content={comment.text} className="text-gray-700 whitespace-pre-wrap" />
                              </div>
                              {/* Comment Attachments */}
                              {comment.attachments && comment.attachments.length > 0 &&
                    <div className="mt-3">
                                  <AttachmentViewer files={comment.attachments} compact />
                                </div>
                    }
                            </div>
                  ) :

                  <p className="text-center text-gray-500 py-4">
                            No comments yet. Be the first to comment!
                          </p>
                  }
                        <div ref={commentsEndRef} />
                      </div>
                      
                      {/* Add Comment */}
                      {userProfile ?
                <div className="space-y-3">
                          <DisplayMentionsTextarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Add a comment... (Type @ to mention users)"
                            minRows={3}
                            disabled={commentLoading}
                          />
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <FileUpload
                              onFilesUploaded={setCommentAttachments}
                              existingFiles={commentAttachments}
                              maxFiles={2}
                              disabled={commentLoading}
                              compact
                            />
                            <button
                              onClick={() => handleAddComment(item.id)}
                              disabled={!commentText.trim() && commentAttachments.length === 0 || commentLoading}
                              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                            >
                              {commentLoading ?
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> :
                                <SafeIcon icon={FiSend} />
                              }
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
          </motion.div> :

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-sm p-8 text-center">

            <SafeIcon icon={FiMap} className="text-gray-400 text-6xl mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No roadmap items found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'All' || priorityFilter !== 'All' || quarterFilter !== 'All' ?
            'Try adjusting your search or filters' :
            isTechnician() ?
            'Get started by adding the first roadmap item' :
            'Check back soon for updates on our development roadmap'}
            </p>
            {isTechnician() &&
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center space-x-2">

                <SafeIcon icon={FiPlus} />
                <span>Add First Item</span>
              </button>
          }
          </motion.div>
        }
      </div>
    </div>);

};

export default Roadmap;