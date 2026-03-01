import React from 'react';
import EmailPasswordAuthScreen from '../../components/EmailPasswordAuthScreen';

const AdminSignInScreen = () => {
  return (
    <EmailPasswordAuthScreen
      title="Admin Sign In"
      subtitle="Select your role then sign in with your password."
    />
  );
};

export default AdminSignInScreen;