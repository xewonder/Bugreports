import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import { FiHelpCircle, FiX, FiMessageCircle, FiBook, FiLifeBuoy } from 'react-icons/fi';

const HelpButton = ({ onOpenHelp }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const helpOptions = [
  {
    id: 'help-hub',
    label: 'Help Center',
    icon: FiHelpCircle,
    action: () => window.open('/help', '_blank'),
    description: 'Get instant help and answers'
  },
  {
    id: 'documentation',
    label: 'Documentation',
    icon: FiBook,
    action: () => window.open('/docs', '_blank'),
    description: 'Browse our complete guides'
  },
  {
    id: 'contact',
    label: 'Contact Support',
    icon: FiLifeBuoy,
    action: () => window.location.href = 'mailto:support@mgg.com',
    description: 'Get in touch with our team'
  }];


  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {showMenu &&
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="mb-4 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">

            {helpOptions.map((option, index) =>
          <motion.button
            key={option.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => {
              option.action();
              setShowMenu(false);
            }}
            className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 min-w-[200px]">

                <div className="flex items-center space-x-3">
                  <SafeIcon icon={option.icon} className="text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">{option.label}</p>
                    <p className="text-xs text-gray-500">{option.description}</p>
                  </div>
                </div>
              </motion.button>
          )}
          </motion.div>
        }
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowMenu(!showMenu)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors">

        <SafeIcon icon={showMenu ? FiX : FiMessageCircle} className="text-xl" />
      </motion.button>

      <AnimatePresence>
        {showTooltip && !showMenu &&
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap">

            Need Help?
            <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

};

export default HelpButton;