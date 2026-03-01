import React from 'react';
import EmailPasswordAuthScreen from '../../components/EmailPasswordAuthScreen';

const DriverSignInScreen = () => {
  return (
    <EmailPasswordAuthScreen
      title="Driver Sign In"
      subtitle="Select your role then sign in with your password."
    />
  );
};

export default DriverSignInScreen;