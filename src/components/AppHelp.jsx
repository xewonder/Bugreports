import React from 'react';
import { HelpHub } from '@questlabs/react-sdk';
import { useAuth } from '../contexts/AuthContext';
import questConfig from '../config/questConfig';

const AppHelp = () => {
  const { userProfile } = useAuth();

  // Generate unique user ID from profile or use fallback
  const uniqueUserId = userProfile?.id || questConfig.USER_ID;

  return (
    <HelpHub
      uniqueUserId={uniqueUserId}
      questId={questConfig.QUEST_HELP_QUESTID}
      botLogo={{
        logo: 'https://quest-media-storage-bucket.s3.us-east-2.amazonaws.com/1741000949338-Vector%20%282%29.png'
      }}
      style={{
        zIndex: 9999999, // Higher than navbar and sidebar
        position: 'fixed',
        bottom: questConfig.HELP_CONFIG.offset.bottom,
        right: questConfig.HELP_CONFIG.offset.right
      }}
      primaryColor={questConfig.PRIMARY_COLOR}
      welcomeMessage={questConfig.HELP_CONFIG.welcomeMessage}
      placeholder={questConfig.HELP_CONFIG.placeholder} />);


};

export default AppHelp;