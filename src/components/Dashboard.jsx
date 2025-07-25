import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SafeIcon from '../common/SafeIcon';
import Header from './Header';
import * as FiIcons from 'react-icons/fi';
import ReactECharts from 'echarts-for-react';
import supabase from '../lib/supabase';

const { FiBug, FiAlertCircle, FiCheckCircle, FiClock, FiTrendingUp, FiActivity, FiStar, FiMap, FiUsers, FiTarget, FiCommand } = FiIcons;

const Dashboard = () => {
  const { userProfile } = useAuth();
  const [bugs, setBugs] = useState([]);
  const [featureRequests, setFeatureRequests] = useState([]);
  const [powerPrompts, setPowerPrompts] = useState([]);
  const [roadmapItems, setRoadmapItems] = useState([]);
  const [loadingBugs, setLoadingBugs] = useState(true);
  const [loadingFeatures, setLoadingFeatures] = useState(true);
  const [loadingPrompts, setLoadingPrompts] = useState(true);
  const [loadingRoadmap, setLoadingRoadmap] = useState(true);

  useEffect(() => {
    fetchBugs();
    fetchFeatureRequests();
    fetchPowerPrompts();
    fetchRoadmapItems();
  }, []);

  const fetchBugs = async () => {
    try {
      setLoadingBugs(true);
      const { data, error } = await supabase
        .from('bugs_mgg2024')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBugs(data || []);
    } catch (error) {
      console.error('Error fetching bugs:', error);
      setBugs([]);
    } finally {
      setLoadingBugs(false);
    }
  };

  const fetchFeatureRequests = async () => {
    try {
      setLoadingFeatures(true);
      const { data, error } = await supabase
        .from('feature_requests_mgg2024')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setFeatureRequests(data || []);
    } catch (error) {
      console.error('Error fetching feature requests:', error);
      setFeatureRequests([]);
    } finally {
      setLoadingFeatures(false);
    }
  };

  const fetchPowerPrompts = async () => {
    try {
      setLoadingPrompts(true);
      const { data, error } = await supabase
        .from('power_prompts_mgg2024')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPowerPrompts(data || []);
    } catch (error) {
      console.error('Error fetching power prompts:', error);
      setPowerPrompts([]);
    } finally {
      setLoadingPrompts(false);
    }
  };

  const fetchRoadmapItems = async () => {
    try {
      setLoadingRoadmap(true);
      const { data, error } = await supabase
        .from('roadmap_items_mgg2024')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRoadmapItems(data || []);
    } catch (error) {
      console.error('Error fetching roadmap items:', error);
      setRoadmapItems([]);
    } finally {
      setLoadingRoadmap(false);
    }
  };

  const bugStats = {
    total: bugs.length,
    open: bugs.filter(bug => bug.status === 'Open').length,
    inProgress: bugs.filter(bug => bug.status === 'In Progress').length,
    resolved: bugs.filter(bug => bug.status === 'Resolved').length,
    critical: bugs.filter(bug => bug.severity === 'Critical').length
  };

  const featureStats = {
    total: featureRequests.length,
    requested: featureRequests.filter(f => f.status === 'requested').length,
    underReview: featureRequests.filter(f => f.status === 'under_review').length,
    planned: featureRequests.filter(f => f.status === 'planned').length,
    inProgress: featureRequests.filter(f => f.status === 'in_progress').length,
    completed: featureRequests.filter(f => f.status === 'completed').length
  };

  const promptStats = {
    total: powerPrompts.length
  };

  const roadmapStats = {
    total: roadmapItems.length,
    completed: roadmapItems.filter(item => item.status === 'completed').length,
    inProgress: roadmapItems.filter(item => item.status === 'in-progress').length,
    planning: roadmapItems.filter(item => item.status === 'planning').length
  };

  const severityData = {
    critical: bugs.filter(bug => bug.severity === 'Critical').length,
    high: bugs.filter(bug => bug.severity === 'High').length,
    medium: bugs.filter(bug => bug.severity === 'Medium').length,
    low: bugs.filter(bug => bug.severity === 'Low').length
  };

  const pieOption = {
    title: {
      text: 'Bugs by Severity',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item'
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '18',
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: [
        { value: severityData.critical, name: 'Critical', itemStyle: { color: '#ef4444' } },
        { value: severityData.high, name: 'High', itemStyle: { color: '#f97316' } },
        { value: severityData.medium, name: 'Medium', itemStyle: { color: '#eab308' } },
        { value: severityData.low, name: 'Low', itemStyle: { color: '#22c55e' } }
      ]
    }]
  };

  const featureStatusOption = {
    title: {
      text: 'Feature Requests Status',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item'
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '18',
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: [
        { value: featureStats.requested, name: 'Requested', itemStyle: { color: '#3b82f6' } },
        { value: featureStats.underReview, name: 'Under Review', itemStyle: { color: '#eab308' } },
        { value: featureStats.planned, name: 'Planned', itemStyle: { color: '#8b5cf6' } },
        { value: featureStats.inProgress, name: 'In Progress', itemStyle: { color: '#f97316' } },
        { value: featureStats.completed, name: 'Completed', itemStyle: { color: '#22c55e' } }
      ]
    }]
  };

  const roadmapProgressOption = {
    title: {
      text: 'Roadmap Progress',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item'
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '18',
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: [
        { value: roadmapStats.completed, name: 'Completed', itemStyle: { color: '#22c55e' } },
        { value: roadmapStats.inProgress, name: 'In Progress', itemStyle: { color: '#f97316' } },
        { value: roadmapStats.planning, name: 'Planning', itemStyle: { color: '#3b82f6' } }
      ]
    }]
  };

  const recentBugs = bugs
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const recentFeatures = featureRequests
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const recentPrompts = powerPrompts
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const statCards = [
    {
      title: 'Open Bugs',
      value: bugStats.open,
      icon: FiAlertCircle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      link: '/bugs'
    },
    {
      title: 'Planned Roadmap',
      value: roadmapStats.planning,
      icon: FiMap,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      link: '/roadmap'
    },
    {
      title: 'Feature Requests',
      value: featureStats.total,
      icon: FiStar,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      link: '/features'
    },
    {
      title: 'Power Prompts',
      value: promptStats.total,
      icon: FiCommand,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      link: '/prompts'
    }
  ];

  return (
    <div>
      <Header />
      <div className="p-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to MGG™ Dashboard
          </h1>
          <p className="text-gray-600">
            Track bugs and monitor development progress for Greta
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {statCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            >
              <Link
                to={card.link}
                className={`${card.bgColor} rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow block`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                    <p className={`text-3xl font-bold ${card.textColor}`}>{card.value}</p>
                  </div>
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <SafeIcon icon={card.icon} className="text-white text-xl" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Bug Severity Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            {loadingBugs ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <ReactECharts option={pieOption} style={{ height: '300px' }} />
            )}
          </motion.div>

          {/* Feature Requests Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            {loadingFeatures ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <ReactECharts option={featureStatusOption} style={{ height: '300px' }} />
            )}
          </motion.div>

          {/* Roadmap Progress Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            {loadingRoadmap ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <ReactECharts option={roadmapProgressOption} style={{ height: '300px' }} />
            )}
          </motion.div>
        </div>

        {/* Recent Items */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Bugs */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <SafeIcon icon={FiBug} className="text-blue-600" />
                <span>Recent Bugs</span>
              </h3>
              <Link to="/bugs" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {loadingBugs ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : (
                <>
                  {recentBugs.map((bug) => (
                    <div key={bug.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className={`w-3 h-3 rounded-full mt-2 ${
                        bug.severity === 'Critical' ? 'bg-red-500' :
                        bug.severity === 'High' ? 'bg-orange-500' :
                        bug.severity === 'Medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}></div>
                      <div className="flex-1">
                        <Link to={`/bugs/${bug.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                          {bug.title}
                        </Link>
                        <p className="text-xs text-gray-500 mt-1">
                          {bug.status} • {bug.severity}
                        </p>
                      </div>
                    </div>
                  ))}
                  {recentBugs.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No bugs reported yet</p>
                  )}
                </>
              )}
            </div>
          </motion.div>

          {/* Recent Feature Requests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <SafeIcon icon={FiStar} className="text-purple-600" />
                <span>Recent Feature Requests</span>
              </h3>
              <Link to="/features" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {loadingFeatures ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                </div>
              ) : (
                <>
                  {recentFeatures.map((feature) => (
                    <div key={feature.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className={`w-3 h-3 rounded-full mt-2 ${
                        feature.status === 'completed' ? 'bg-green-500' :
                        feature.status === 'in_progress' ? 'bg-orange-500' :
                        feature.status === 'planned' ? 'bg-purple-500' :
                        feature.status === 'under_review' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{feature.title}</div>
                        <p className="text-xs text-gray-500 mt-1">
                          {feature.status.replace('_', ' ')} • {feature.priority}
                        </p>
                      </div>
                    </div>
                  ))}
                  {recentFeatures.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No feature requests yet</p>
                  )}
                </>
              )}
            </div>
          </motion.div>

          {/* Recent Power Prompts */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <SafeIcon icon={FiCommand} className="text-indigo-600" />
                <span>Recent Power Prompts</span>
              </h3>
              <Link to="/prompts" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {loadingPrompts ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                </div>
              ) : (
                <>
                  {recentPrompts.map((prompt) => (
                    <div key={prompt.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="w-3 h-3 rounded-full mt-2 bg-indigo-500"></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{prompt.title}</div>
                        <p className="text-xs text-gray-500 mt-1">
                          By {prompt.user_nickname || prompt.user_name} •{' '}
                          {new Date(prompt.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {recentPrompts.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No power prompts yet</p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;