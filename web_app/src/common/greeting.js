import React from 'react';
import { Box, Text } from '@cloudscape-design/components';

/**
 * Greeting component to display a welcome message to the user
 * @param {Object} props - Component properties
 * @param {Object} props.userInfo - User information object containing email
 * @param {string} props.className - Optional CSS class name
 * @returns {JSX.Element} - Greeting component
 */
const Greeting = ({ userInfo, className }) => {
  if (!userInfo) return null;
  
  // Get the user's name from email (part before @)
  const userName = userInfo.email.split('@')[0];
  
  // Get time of day for contextual greeting
  const hour = new Date().getHours();
  let greeting = 'Welcome';
  
  if (hour < 12) {
    greeting = 'Good morning';
  } else if (hour < 18) {
    greeting = 'Good afternoon';
  } else {
    greeting = 'Good evening';
  }

  return (
    <Box className={className} padding={{ top: 'xs' }}>
      <Text variant="heading-s">
        {greeting}, {userName}!
      </Text>
    </Box>
  );
};

export default Greeting;