import React, {useState, useEffect, useRef} from 'react';
import {motion} from 'framer-motion';
import {useAuth} from '../contexts/AuthContext';
import {useMention} from '../contexts/MentionContext';
import SafeIcon from '../common/SafeIcon';
import Header from './Header';
import FileUpload from './FileUpload';
import AttachmentViewer from './AttachmentViewer';
import EnhancedTextarea from './EnhancedTextarea';
import MentionSuggestions from './MentionSuggestions';
import * as FiIcons from 'react-icons/fi';
import {format} from 'date-fns';
import supabase from '../lib/supabase';

const {
  FiMessageCircle,
  FiSearch,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiSend,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiLoader,
  FiThumbsUp,
  FiPaperclip,
  FiChevronDown,
  FiChevronUp
} = FiIcons;

const GeneralTalk = () => {
  const {userProfile, isTechnician} = useAuth();
  const {processMentions, renderWithMentions} = useMention();
  const [topics, setTopics] = useState([]);
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [form, setForm] = useState({title: '', content: ''});
  const [formAttachments, setFormAttachments] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [comments, setComments] = useState({});
  const [commentCounts, setCommentCounts] = useState({});
  const [newComment, setNewComment] = useState({});
  const [commentAttachments, setCommentAttachments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [votes, setVotes] = useState({counts: {}, userVotes: {}});
  const [statusMessage, setStatusMessage] = useState({type: '', message: ''});
  const [loadingComments, setLoadingComments] = useState({});
  const commentsEndRef = useRef(null);

  // Add refs for textareas
  const formContentRef = useRef(null);
  const commentTextAreaRefs = useRef({});

  useEffect(() => {
    fetchTopics();
  }, []);

  useEffect(() => {
    if (expandedTopic) {
      fetchComments(expandedTopic);
    }
  }, [expandedTopic]);

  useEffect(() => {
    if (expandedTopic && comments[expandedTopic]?.length > 0) {
      commentsEndRef.current?.scrollIntoView({behavior: 'smooth'});
    }
  }, [comments, expandedTopic]);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      console.log("Fetching topics...");

      // Direct table approach to avoid view issues
      const {data, error} = await supabase
        .from('general_topics_mgg2024')
        .select('*')
        .order('created_at', {ascending: false});

      if (error) throw error;

      // Enhance topics with user data if we have data
      if (data && data.length > 0) {
        const enhancedData = await Promise.all(data.map(async (topic) => {
          const {data: userData, error: userError} = await supabase
            .from('profiles_mgg_2024')
            .select('full_name, nickname, role')
            .eq('id', topic.user_id)
            .single();

          if (userError) {
            console.warn('Error fetching user data for topic:', userError);
            return {
              ...topic, 
              user_full_name: 'Unknown',
              user_nickname: 'User',
              user_role: 'user'
            };
          }

          return {
            ...topic,
            user_full_name: userData?.full_name || 'Unknown',
            user_nickname: userData?.nickname || 'User',
            user_role: userData?.role || 'user'
          };
        }));

        setTopics(enhancedData);
      } else {
        setTopics([]);
      }

      await fetchVotes();
      await fetchAllCommentCounts(data || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
      setStatusMessage({type: 'error', message: 'Failed to load topics: ' + error.message});
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCommentCounts = async (topicsList) => {
    if (!topicsList || topicsList.length === 0) return;

    try {
      const {data: commentsData, error} = await supabase
        .from('general_topic_comments_mgg2024')
        .select('topic_id');

      if (error) throw error;

      const counts = {};
      // Initialize all topics with 0 count
      topicsList.forEach(topic => {
        counts[topic.id] = 0;
      });

      // Count actual comments
      if (commentsData && commentsData.length > 0) {
        commentsData.forEach(comment => {
          counts[comment.topic_id] = (counts[comment.topic_id] || 0) + 1;
        });
      }

      setCommentCounts(counts);
    } catch (error) {
      console.error('Error fetching comment counts:', error);
    }
  };

  const fetchComments = async (topicId) => {
    try {
      setLoadingComments(prev => ({...prev, [topicId]: true}));
      
      const {data, error} = await supabase
        .from('general_topic_comments_mgg2024')
        .select('*')
        .eq('topic_id', topicId)
        .order('created_at', {ascending: true});

      if (error) throw error;

      // Enhance comments with user data
      const enhancedComments = await Promise.all((data || []).map(async (comment) => {
        const {data: userData, error: userError} = await supabase
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
      }));

      setComments(prev => ({...prev, [topicId]: enhancedComments}));
      setCommentCounts(prev => ({...prev, [topicId]: enhancedComments?.length || 0}));
      
      return enhancedComments;
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    } finally {
      setLoadingComments(prev => ({...prev, [topicId]: false}));
    }
  };

  const fetchVotes = async () => {
    try {
      const {data, error} = await supabase
        .from('general_topic_votes_mgg2024')
        .select('*');

      if (error) throw error;

      const voteCounts = {};
      const userVotes = {};
      
      data?.forEach(vote => {
        voteCounts[vote.topic_id] = (voteCounts[vote.topic_id] || 0) + 1;
        if (vote.user_id === userProfile?.id) {
          userVotes[vote.topic_id] = true;
        }
      });

      setVotes({counts: voteCounts, userVotes: userVotes});
    } catch (error) {
      console.error('Error fetching votes:', error);
    }
  };

  const handleSubmitTopic = async (e) => {
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
      setStatusMessage({type: 'error', message: 'You must be logged in to create a topic'});
      return;
    }

    setFormSubmitting(true);
    
    try {
      if (editingTopic) {
        // Update existing topic
        const {data, error} = await supabase
          .from('general_topics_mgg2024')
          .update({
            title: form.title.trim(),
            content: form.content.trim(),
            attachments: formAttachments,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTopic.id)
          .select();

        if (error) throw error;

        // Process mentions in the topic content
        processMentions(form.content.trim(), 'general_topic', editingTopic.id);

        // Get user data to enhance the updated topic
        const {data: userData, error: userError} = await supabase
          .from('profiles_mgg_2024')
          .select('full_name, nickname, role')
          .eq('id', editingTopic.user_id)
          .single();

        if (userError) throw userError;

        const updatedTopic = {
          ...data[0],
          user_full_name: userData?.full_name || 'Unknown',
          user_nickname: userData?.nickname || 'User',
          user_role: userData?.role || 'user'
        };

        setTopics(prev => 
          prev.map(topic => 
            topic.id === editingTopic.id ? updatedTopic : topic
          )
        );

        setStatusMessage({type: 'success', message: 'Topic updated successfully!'});
      } else {
        // Create new topic
        const topicData = {
          title: form.title.trim(),
          content: form.content.trim(),
          user_id: userProfile.id,
          attachments: formAttachments
        };

        const {data, error} = await supabase
          .from('general_topics_mgg2024')
          .insert([topicData])
          .select();

        if (error) throw error;

        // Process mentions in the topic content
        processMentions(form.content.trim(), 'general_topic', data[0].id);

        // Get user data to enhance the new topic
        const {data: userData, error: userError} = await supabase
          .from('profiles_mgg_2024')
          .select('full_name, nickname, role')
          .eq('id', userProfile.id)
          .single();

        if (userError) throw userError;

        const newTopicWithUser = {
          ...data[0],
          user_full_name: userData?.full_name || 'Unknown',
          user_nickname: userData?.nickname || 'User',
          user_role: userData?.role || 'user'
        };

        setTopics([newTopicWithUser, ...topics]);
        setCommentCounts(prev => ({...prev, [data[0].id]: 0}));
        
        setStatusMessage({type: 'success', message: 'Topic created successfully!'});
      }

      setForm({title: '', content: ''});
      setFormAttachments([]);
      setShowForm(false);
      setEditingTopic(null);

      setTimeout(() => {
        setStatusMessage({type: '', message: ''});
      }, 3000);
    } catch (error) {
      console.error('Error submitting topic:', error);
      setStatusMessage({type: 'error', message: 'Failed to submit topic: ' + error.message});
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleVote = async (topicId) => {
    if (!userProfile) {
      setStatusMessage({type: 'error', message: 'You must be logged in to vote'});
      return;
    }

    try {
      const hasVoted = votes.userVotes?.[topicId];
      
      if (hasVoted) {
        // Remove vote
        const {error} = await supabase
          .from('general_topic_votes_mgg2024')
          .delete()
          .eq('topic_id', topicId)
          .eq('user_id', userProfile.id);

        if (error) throw error;

        setVotes(prev => ({
          counts: {...prev.counts, [topicId]: Math.max(0, (prev.counts[topicId] || 0) - 1)},
          userVotes: {...prev.userVotes, [topicId]: false}
        }));
      } else {
        // Add vote
        const {error} = await supabase
          .from('general_topic_votes_mgg2024')
          .insert([{
            topic_id: topicId,
            user_id: userProfile.id,
            vote_type: 'upvote'
          }]);

        if (error) throw error;

        setVotes(prev => ({
          counts: {...prev.counts, [topicId]: (prev.counts[topicId] || 0) + 1},
          userVotes: {...prev.userVotes, [topicId]: true}
        }));
      }
    } catch (error) {
      console.error('Error voting on topic:', error);
      setStatusMessage({type: 'error', message: 'Failed to update vote: ' + error.message});
    }
  };

  const handleAddComment = async (topicId) => {
    const text = newComment[topicId];
    if (!text || !text.trim()) return;
    if (!userProfile) return;
    
    try {
      const {data, error} = await supabase
        .from('general_topic_comments_mgg2024')
        .insert([{
          topic_id: topicId,
          text: text.trim(),
          user_id: userProfile.id,
          attachments: commentAttachments
        }])
        .select();

      if (error) throw error;

      // Process mentions in the comment
      processMentions(text.trim(), 'general_topic_comment', topicId);

      // Enhance the comment with user data
      const {data: userData, error: userError} = await supabase
        .from('profiles_mgg_2024')
        .select('full_name, nickname, role')
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
        [topicId]: [...(prev[topicId] || []), newCommentWithUser]
      }));
      
      setCommentCounts(prev => ({
        ...prev,
        [topicId]: (prev[topicId] || 0) + 1
      }));
      
      setNewComment({...newComment, [topicId]: ''});
      setCommentAttachments([]);
      
      setStatusMessage({type: 'success', message: 'Comment added successfully'});
      
      setTimeout(() => {
        setStatusMessage({type: '', message: ''});
      }, 3000);
    } catch (error) {
      console.error('Error adding comment:', error);
      setStatusMessage({type: 'error', message: 'Failed to add comment: ' + error.message});
    }
  };

  const handleDeleteComment = async (comment) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      const {error} = await supabase
        .from('general_topic_comments_mgg2024')
        .delete()
        .eq('id', comment.id);

      if (error) throw error;

      setComments(prev => ({
        ...prev,
        [comment.topic_id]: (prev[comment.topic_id] || []).filter(c => c.id !== comment.id)
      }));
      
      setCommentCounts(prev => ({
        ...prev,
        [comment.topic_id]: Math.max(0, (prev[comment.topic_id] || 1) - 1)
      }));
      
      setStatusMessage({type: 'success', message: 'Comment deleted successfully'});
      
      setTimeout(() => {
        setStatusMessage({type: '', message: ''});
      }, 3000);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setStatusMessage({type: 'error', message: 'Failed to delete comment'});
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm('Are you sure you want to delete this topic?')) return;
    
    try {
      const {error} = await supabase
        .from('general_topics_mgg2024')
        .delete()
        .eq('id', topicId);

      if (error) throw error;

      setTopics(prev => prev.filter(topic => topic.id !== topicId));
      setStatusMessage({type: 'success', message: 'Topic deleted successfully'});
      
      setTimeout(() => {
        setStatusMessage({type: '', message: ''});
      }, 3000);
    } catch (error) {
      console.error('Error deleting topic:', error);
      setStatusMessage({type: 'error', message: 'Failed to delete topic'});
    }
  };

  const handleEditTopic = (topic) => {
    setEditingTopic(topic);
    setForm({title: topic.title, content: topic.content});
    setFormAttachments(topic.attachments || []);
    setShowForm(true);
  };

  const handleExpandTopic = async (topicId) => {
    if (expandedTopic === topicId) {
      setExpandedTopic(null);
    } else {
      setExpandedTopic(topicId);
      if (!comments[topicId]) {
        await fetchComments(topicId);
      }
    }
  };

  const canUserEditTopic = (topic) => {
    return userProfile && (topic.user_id === userProfile.id || isTechnician());
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
    if (
      item.user_nickname && 
      typeof item.user_nickname === 'string' && 
      item.user_nickname.trim() !== ''
    ) {
      return item.user_nickname;
    }
    
    if (
      item.user_full_name && 
      typeof item.user_full_name === 'string' && 
      item.user_full_name.trim() !== ''
    ) {
      return item.user_full_name;
    }
    
    return 'Anonymous';
  };

  const filteredTopics = topics
    .filter(topic => 
      topic.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      topic.content.toLowerCase().includes(searchTerm.toLowerCase())
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
  const CommentItem = ({comment}) => (
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
          <p className="text-gray-600">Loading topics...</p>
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
          initial={{opacity: 0, y: -20}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.5}}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">General Talk</h1>
            <p className="text-gray-600">Discuss anything related to MGG™</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <SafeIcon icon={FiPlus} />
            <span>New Topic</span>
          </button>
        </motion.div>

        {/* Status Message */}
        {statusMessage.message && (
          <motion.div
            initial={{opacity: 0, y: -10}}
            animate={{opacity: 1, y: 0}}
            className={`p-4 rounded-lg mb-6 flex items-center space-x-2 ${
              statusMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            <SafeIcon icon={statusMessage.type === 'success' ? FiCheckCircle : FiAlertCircle} className="flex-shrink-0" />
            <span>{statusMessage.message}</span>
            <button
              onClick={() => setStatusMessage({type: '', message: ''})}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              <SafeIcon icon={FiX} />
            </button>
          </motion.div>
        )}

        {/* Create/Edit Form */}
        {showForm && (
          <motion.div
            initial={{opacity: 0, y: -20}}
            animate={{opacity: 1, y: 0}}
            className="bg-white rounded-xl shadow-sm p-6 mb-8"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <SafeIcon icon={FiMessageCircle} className="mr-2 text-blue-600" />
              {editingTopic ? 'Edit Topic' : 'Create New Topic'}
            </h2>
            <form onSubmit={handleSubmitTopic} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => {
                    setForm({...form, title: e.target.value});
                    if (formErrors.title) setFormErrors({...formErrors, title: ''});
                  }}
                  placeholder="Enter a descriptive title for your topic"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                    ref={formContentRef}
                    value={form.content}
                    onChange={(e) => {
                      setForm({...form, content: e.target.value});
                      if (formErrors.content) setFormErrors({...formErrors, content: ''});
                    }}
                    placeholder="What would you like to discuss? (Type @ to mention users)"
                    minRows={8}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.content ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={formSubmitting}
                  />
                  <MentionSuggestions textAreaRef={formContentRef} />
                </div>
                {formErrors.content && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.content}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Share your thoughts, ask questions, or start a discussion with the community.
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
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  disabled={formSubmitting}
                >
                  <SafeIcon icon={FiCheckCircle} />
                  <span>{editingTopic ? 'Update Topic' : 'Create Topic'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTopic(null);
                    setForm({title: '', content: ''});
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
                placeholder="Search topics by title or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="created_at">Newest First</option>
                <option value="votes">Most Voted</option>
              </select>
            </div>
            <div className="flex items-center justify-center bg-gray-50 rounded-lg px-4 py-2">
              <span className="text-sm text-gray-600">
                {filteredTopics.length} of {topics.length} topics
              </span>
            </div>
          </div>
        </div>

        {/* Topics List */}
        <div className="space-y-6">
          {filteredTopics.map((topic, index) => (
            <motion.div
              key={topic.id}
              initial={{opacity: 0, y: 20}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.3, delay: index * 0.05}}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              {/* Topic Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <SafeIcon icon={FiMessageCircle} className="text-blue-600" />
                      <h3
                        className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
                        onClick={() => handleExpandTopic(topic.id)}
                      >
                        {topic.title}
                      </h3>
                    </div>
                    {/* User and Date */}
                    <p className="text-sm text-gray-500 mb-4">
                      Shared by {getDisplayName(topic)} on{' '}
                      {format(new Date(topic.created_at), 'MMM dd, yyyy')}
                      {topic.updated_at !== topic.created_at && 
                        ` (updated ${format(new Date(topic.updated_at), 'MMM dd, yyyy')})`}
                    </p>
                    {/* Topic Content Preview */}
                    <div className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap mb-4 border border-gray-200">
                      {topic.content.length > 200 ? (
                        <div>
                          {renderWithMentions(topic.content.substring(0, 200))}...
                        </div>
                      ) : (
                        renderWithMentions(topic.content)
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Voting Controls */}
                        <button
                          onClick={() => handleVote(topic.id)}
                          className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                            votes.userVotes?.[topic.id]
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                          }`}
                          title={votes.userVotes?.[topic.id] ? 'Remove vote' : 'Vote for this topic'}
                        >
                          <SafeIcon icon={FiThumbsUp} className="text-sm" />
                          <span className="text-sm">
                            {votes.counts?.[topic.id] || 0}
                          </span>
                        </button>
                        {/* Comment Count / Expand Button */}
                        <button
                          onClick={() => handleExpandTopic(topic.id)}
                          className="flex items-center space-x-1 text-gray-500 hover:text-blue-600"
                        >
                          <SafeIcon icon={FiMessageCircle} className="text-sm" />
                          <span className="text-sm">
                            {commentCounts[topic.id] !== undefined ? commentCounts[topic.id] : 0} Comments
                          </span>
                        </button>
                        {/* Show full content button if truncated */}
                        {topic.content.length > 200 && (
                          <button
                            onClick={() => handleExpandTopic(topic.id)}
                            className="text-gray-500 hover:text-blue-600 text-sm"
                          >
                            Read More
                          </button>
                        )}
                      </div>
                      {/* Edit/Delete Buttons */}
                      {canUserEditTopic(topic) && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditTopic(topic)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit topic"
                          >
                            <SafeIcon icon={FiEdit3} />
                          </button>
                          <button
                            onClick={() => handleDeleteTopic(topic.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete topic"
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
              {expandedTopic === topic.id && (
                <div className="p-6 bg-gray-50 border-t border-gray-100">
                  <div className="mb-4">
                    <p className="text-gray-700 whitespace-pre-wrap font-mono">
                      {renderWithMentions(topic.content)}
                    </p>
                  </div>
                  
                  {/* Topic Attachments */}
                  {topic.attachments && topic.attachments.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <SafeIcon icon={FiPaperclip} className="mr-2 text-gray-500" />
                        Attachments
                      </h4>
                      <AttachmentViewer files={topic.attachments} />
                    </div>
                  )}
                  
                  <div className="mt-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <SafeIcon icon={FiMessageCircle} className="mr-2 text-blue-600" />
                      <span>Comments ({comments[topic.id]?.length || 0})</span>
                    </h4>
                    
                    {/* Comments List */}
                    <div className="space-y-4 max-h-96 overflow-y-auto mb-6 p-1">
                      {loadingComments[topic.id] ? (
                        <div className="flex justify-center py-4">
                          <SafeIcon icon={FiLoader} className="text-blue-600 animate-spin" />
                          <span className="ml-2 text-gray-600">Loading comments...</span>
                        </div>
                      ) : (
                        <>
                          {(comments[topic.id] || []).length > 0 ? (
                            (comments[topic.id] || []).map((comment) => (
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
                            ref={(el) => (commentTextAreaRefs.current[topic.id] = el)}
                            value={newComment[topic.id] || ''}
                            onChange={(e) => setNewComment({...newComment, [topic.id]: e.target.value})}
                            placeholder="Add a comment... (Type @ to mention users)"
                            minRows={3}
                            disabled={commentLoading}
                          />
                          <MentionSuggestions textAreaRef={{current: commentTextAreaRefs.current[topic.id]}} />
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
                            onClick={() => handleAddComment(topic.id)}
                            disabled={!newComment[topic.id]?.trim() || commentLoading}
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

          {filteredTopics.length === 0 && (
            <motion.div
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              className="bg-white rounded-xl shadow-md p-8 text-center"
            >
              <SafeIcon icon={FiMessageCircle} className="text-gray-400 text-6xl mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No topics found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Be the first to start a discussion!'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Create Your First Topic
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneralTalk;