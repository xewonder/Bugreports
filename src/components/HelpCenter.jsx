import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import Header from './Header';
import * as FiIcons from 'react-icons/fi';

const { FiSearch, FiBook, FiHelpCircle, FiMessageCircle, FiVideo, FiDownload, FiExternalLink } = FiIcons;

const HelpCenter = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Topics', icon: FiBook },
    { id: 'getting-started', name: 'Getting Started', icon: FiHelpCircle },
    { id: 'bug-reporting', name: 'Bug Reporting', icon: FiMessageCircle },
    { id: 'features', name: 'Feature Requests', icon: FiVideo },
    { id: 'account', name: 'Account Settings', icon: FiDownload }
  ];

  const helpArticles = [
    {
      id: 1,
      title: 'Getting Started with MGG™',
      category: 'getting-started',
      description: 'Learn the basics of using the MGG™ Software Package',
      readTime: '5 min read',
      popularity: 'high'
    },
    {
      id: 2,
      title: 'How to Report a Bug',
      category: 'bug-reporting',
      description: 'Step-by-step guide to reporting bugs effectively',
      readTime: '3 min read',
      popularity: 'high'
    },
    {
      id: 3,
      title: 'Submitting Feature Requests',
      category: 'features',
      description: 'Learn how to suggest new features for the platform',
      readTime: '4 min read',
      popularity: 'medium'
    },
    {
      id: 4,
      title: 'Managing Your Account',
      category: 'account',
      description: 'Update your profile, preferences, and security settings',
      readTime: '6 min read',
      popularity: 'medium'
    },
    {
      id: 5,
      title: 'Understanding User Roles',
      category: 'getting-started',
      description: 'Learn about different user roles and permissions',
      readTime: '4 min read',
      popularity: 'low'
    },
    {
      id: 6,
      title: 'Using the Roadmap Feature',
      category: 'features',
      description: 'Navigate and understand the development roadmap',
      readTime: '5 min read',
      popularity: 'medium'
    }
  ];

  const filteredArticles = helpArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const quickActions = [
    {
      title: 'Contact Support',
      description: 'Get in touch with our support team',
      icon: FiMessageCircle,
      action: () => window.location.href = 'mailto:support@mgg.com'
    },
    {
      title: 'Video Tutorials',
      description: 'Watch step-by-step video guides',
      icon: FiVideo,
      action: () => window.open('/tutorials', '_blank')
    },
    {
      title: 'Download Guide',
      description: 'Get the complete user manual',
      icon: FiDownload,
      action: () => window.open('/guide.pdf', '_blank')
    }
  ];

  return (
    <div>
      <Header />
      <div className="p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Help Center</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Find answers to your questions and learn how to make the most of MGG™ Software Package
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-2xl mx-auto mb-8"
        >
          <div className="relative">
            <SafeIcon icon={FiSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {quickActions.map((action, index) => (
            <motion.button
              key={action.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
              onClick={action.action}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 text-left"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <SafeIcon icon={action.icon} className="text-blue-600 text-xl" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                  <p className="text-gray-600 text-sm">{action.description}</p>
                </div>
                <SafeIcon icon={FiExternalLink} className="text-gray-400" />
              </div>
            </motion.button>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-3 ${
                      selectedCategory === category.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <SafeIcon icon={category.icon} className="text-sm" />
                    <span>{category.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Articles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-3"
          >
            <div className="space-y-4">
              {filteredArticles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {article.title}
                      </h4>
                      <p className="text-gray-600 mb-3">{article.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{article.readTime}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          article.popularity === 'high' 
                            ? 'bg-green-100 text-green-700'
                            : article.popularity === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {article.popularity} popularity
                        </span>
                      </div>
                    </div>
                    <SafeIcon icon={FiExternalLink} className="text-gray-400 ml-4" />
                  </div>
                </motion.div>
              ))}

              {filteredArticles.length === 0 && (
                <div className="text-center py-12">
                  <SafeIcon icon={FiSearch} className="text-gray-300 text-6xl mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
                  <p className="text-gray-600">
                    Try adjusting your search terms or browse different categories
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;