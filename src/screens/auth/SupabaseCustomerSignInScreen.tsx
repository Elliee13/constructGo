import React from 'react';
import EmailPasswordAuthScreen from '../../components/EmailPasswordAuthScreen';

const SupabaseCustomerSignInScreen = () => {
  return (
    <EmailPasswordAuthScreen
      title="ConstructGo Sign In"
      subtitle="Select your role then sign in with your password."
    />
  );
};

export default SupabaseCustomerSignInScreen;