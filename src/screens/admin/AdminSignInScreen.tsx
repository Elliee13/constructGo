import React from 'react';
import EmailPasswordAuthScreen from '../../components/EmailPasswordAuthScreen';

const AdminSignInScreen = () => {
  return (
    <EmailPasswordAuthScreen
      expectedRole="admin"
      title="Admin Sign In"
      subtitle="View operations and apply safe controls."
      defaultEmail="admin@constructgo.app"
      defaultPassword="password123"
    />
  );
};

export default AdminSignInScreen;

