import React from 'react';
import EmailPasswordAuthScreen from '../../components/EmailPasswordAuthScreen';

const SupabaseCustomerSignInScreen = () => {
  return (
    <EmailPasswordAuthScreen
      expectedRole="customer"
      title="Customer Sign In"
      subtitle="Sign in to continue shopping and checkout."
      defaultEmail="customer@constructgo.app"
      defaultPassword="password123"
    />
  );
};

export default SupabaseCustomerSignInScreen;

