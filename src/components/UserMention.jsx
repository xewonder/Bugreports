import React from 'react';
import {motion} from 'framer-motion';

/**
 * UserMention component for displaying a mentioned user
 * @param {Object} props
 * @param {string} props.userId - The ID of the mentioned user
 * @param {string} props.username - The username/nickname of the mentioned user
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
const UserMention = ({userId, username, className = ''}) => {
  // Make mentions clickable and visually distinct
  return (
    <motion.span
      initial={{backgroundColor: '#e0f2fe'}}
      animate={{backgroundColor: '#dbeafe'}}
      whileHover={{backgroundColor: '#bfdbfe'}}
      className={`inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-blue-700 hover:bg-blue-100 transition-colors font-medium cursor-pointer ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        console.log(`Clicked on mention: ${username} (${userId})`);
        // In a future implementation, you could navigate to a user profile here
      }}
    >
      @{username}
    </motion.span>
  );
};

export default UserMention;