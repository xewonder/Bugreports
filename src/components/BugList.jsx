import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import SafeIcon from '../common/SafeIcon';
import Header from './Header';
import * as FiIcons from 'react-icons/fi';
import { format } from 'date-fns';
import supabase from '../lib/supabase';

const { FiSearch, FiFilter, FiPlus, FiEdit3, FiTrash2, FiEye, FiThumbsUp, FiLoader } = FiIcons;

const BugList = () => {
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('created_at');
  const [bugs, setBugs] = useState([]);
  const [bugVotes, setBugVotes] = useState({});
  const [userVotes, setUserVotes] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBugs();
  }, []);

  const fetchBugs = async () => {
    try {
      setLoading(true);
      // Use direct table queries instead of views
      const { data: bugsData, error: bugsError } = await supabase
        .from('bugs_mgg2024')
        .select('*')
        .order('created_at', { ascending: false });

      if (bugsError) throw bugsError;
      
      // Enhance bugs with user data
      if (bugsData && bugsData.length > 0) {
        const enhancedData = await Promise.all(bugsData.map(async (bug) => {
          const { data: userData, error: userError } = await supabase
            .from('profiles_mgg_2024')
            .select('full_name, nickname, role')
            .eq('id', bug.reporter_id)
            .single();
          
          if (userError) {
            console.warn('Error fetching user data for bug:', userError);
            return {
              ...bug,
              reporter_full_name: 'Unknown',
              reporter_nickname: 'User',
              reporter_role: 'user'
            };
          }
          
          return {
            ...bug,
            reporter_full_name: userData?.full_name || 'Unknown',
            reporter_nickname: userData?.nickname || 'User',
            reporter_role: userData?.role || 'user'
          };
        }));
        
        setBugs(enhancedData);
      } else {
        setBugs([]);
      }

      // Fetch vote counts for all bugs
      const { data: votesData, error: votesError } = await supabase
        .from('bug_votes_mgg2024')
        .select('bug_id, user_id');

      if (votesError) throw votesError;

      // Process votes
      const voteCounts = {};
      const userVoteMap = {};
      votesData?.forEach(vote => {
        // Count total votes
        voteCounts[vote.bug_id] = (voteCounts[vote.bug_id] || 0) + 1;
        // Track user's votes
        if (vote.user_id === userProfile?.id) {
          userVoteMap[vote.bug_id] = true;
        }
      });
      
      setBugVotes(voteCounts);
      setUserVotes(userVoteMap);
    } catch (error) {
      console.error('Error fetching bugs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (bugId) => {
    if (!userProfile) return;

    try {
      const hasVoted = userVotes[bugId];
      
      if (hasVoted) {
        // Remove vote
        const { error } = await supabase
          .from('bug_votes_mgg2024')
          .delete()
          .eq('bug_id', bugId)
          .eq('user_id', userProfile.id);

        if (error) throw error;
        
        // Update local state
        setUserVotes(prev => {
          const newVotes = { ...prev };
          delete newVotes[bugId];
          return newVotes;
        });
        setBugVotes(prev => ({ ...prev, [bugId]: Math.max(0, (prev[bugId] || 0) - 1) }));
      } else {
        // Add vote
        const { error } = await supabase
          .from('bug_votes_mgg2024')
          .insert([{ bug_id: bugId, user_id: userProfile.id, vote_type: 'upvote' }]);

        if (error) throw error;
        
        // Update local state
        setUserVotes(prev => ({ ...prev, [bugId]: true }));
        setBugVotes(prev => ({ ...prev, [bugId]: (prev[bugId] || 0) + 1 }));
      }
    } catch (error) {
      console.error('Error voting on bug:', error);
    }
  };

  const filteredBugs = bugs
    .filter(bug => {
      const matchesSearch = 
        bug.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        bug.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || bug.status === statusFilter;
      const matchesSeverity = severityFilter === 'All' || bug.severity === severityFilter;
      return matchesSearch && matchesStatus && matchesSeverity;
    })
    .sort((a, b) => {
      if (sortBy === 'created_at') {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      if (sortBy === 'updated_at') {
        return new Date(b.updated_at) - new Date(a.updated_at);
      }
      if (sortBy === 'votes') {
        return (bugVotes[b.id] || 0) - (bugVotes[a.id] || 0);
      }
      if (sortBy === 'severity') {
        const severityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return a[sortBy]?.localeCompare(b[sortBy]) || 0;
    });

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

  const getDisplayName = (bug) => {
    if (bug.reporter_nickname && typeof bug.reporter_nickname === 'string' && bug.reporter_nickname.trim() !== '') {
      return bug.reporter_nickname;
    }
    
    if (bug.reporter_full_name && typeof bug.reporter_full_name === 'string' && bug.reporter_full_name.trim() !== '') {
      return bug.reporter_full_name;
    }
    
    return 'Anonymous';
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="p-6 text-center">
          <SafeIcon icon={FiLoader} className="text-blue-600 text-5xl mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading bugs...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="p-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">MGG™ Bug Reports</h1>
            <p className="text-gray-600">Track and manage issues in Make Greta Great</p>
          </div>
          <Link
            to="/create-bug"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <SafeIcon icon={FiPlus} />
            <span>Report Bug</span>
          </Link>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <SafeIcon icon={FiSearch} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search bugs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="created_at">Created Date</option>
              <option value="updated_at">Updated Date</option>
              <option value="votes">Most Voted</option>
              <option value="severity">Severity</option>
              <option value="status">Status</option>
            </select>

            {/* Stats */}
            <div className="flex items-center justify-center bg-gray-50 rounded-lg px-4 py-2">
              <span className="text-sm text-gray-600">
                {filteredBugs.length} of {bugs.length} bugs
              </span>
            </div>
          </div>
        </motion.div>

        {/* Bug List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          {filteredBugs.map((bug, index) => (
            <motion.div
              key={bug.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Link
                      to={`/bugs/${bug.id}`}
                      className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {bug.title}
                    </Link>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(bug.severity)}`}>
                      {bug.severity}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(bug.status)}`}>
                      {bug.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3 line-clamp-2">{bug.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Assignee: {bug.assignee || 'Unassigned'}</span>
                    <span>Reporter: {getDisplayName(bug)}</span>
                    <span>Created: {format(new Date(bug.created_at), 'MMM dd, yyyy')}</span>
                  </div>
                  {bug.tags && bug.tags.length > 0 && (
                    <div className="flex items-center space-x-2 mt-3">
                      {bug.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {/* Upvote Button */}
                  <button
                    onClick={() => handleVote(bug.id)}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                      userVotes[bug.id] ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                    title={userVotes[bug.id] ? 'Remove vote' : 'Upvote'}
                  >
                    <SafeIcon icon={FiThumbsUp} className="text-sm" />
                    <span className="text-sm font-medium">{bugVotes[bug.id] || 0}</span>
                  </button>
                  <Link
                    to={`/bugs/${bug.id}`}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <SafeIcon icon={FiEye} />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
          
          {filteredBugs.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <SafeIcon icon={FiSearch} className="text-gray-300 text-6xl mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bugs found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default BugList;