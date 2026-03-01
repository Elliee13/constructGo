import React from 'react';
import EmailPasswordAuthScreen from '../../components/EmailPasswordAuthScreen';

const StoreOwnerSignInScreen = () => {
  return (
    <EmailPasswordAuthScreen
      title="Store Owner Sign In"
      subtitle="Select your role then sign in with your password."
    />
  );
};

export default StoreOwnerSignInScreen;