import React from 'react';
import EmailPasswordAuthScreen from '../../components/EmailPasswordAuthScreen';

const StoreOwnerSignInScreen = () => {
  return (
    <EmailPasswordAuthScreen
      expectedRole="store_owner"
      title="Store Owner Sign In"
      subtitle="Manage incoming orders and product catalog."
      defaultEmail="owner@constructgo.app"
      defaultPassword="password123"
    />
  );
};

export default StoreOwnerSignInScreen;

