import React from 'react';
import EmailPasswordAuthScreen from '../../components/EmailPasswordAuthScreen';

const DriverSignInScreen = () => {
  return (
    <EmailPasswordAuthScreen
      expectedRole="driver"
      title="Driver Sign In"
      subtitle="Sign in with your driver account credentials."
      defaultEmail="driver@constructgo.app"
      defaultPassword="password123"
    />
  );
};

export default DriverSignInScreen;

