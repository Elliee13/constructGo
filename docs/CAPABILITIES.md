ConstructGo Capabilities

This app has 4 roles:
- Customer
- Store Owner
- Driver
- Admin

All roles use the same core data stores for orders, products, chat, and notifications.

 Customer
- Start app and choose Customer
  - Needs: `appRole = customer`
  - Does: Opens onboarding/auth if needed, then Customer tabs
  - Files: `src/screens/role/RoleSelectScreen.tsx`, `src/navigation/RootNavigator.tsx`

- Complete onboarding/login once
  - Needs: Not yet onboarded/logged in
  - Does: Phone -> OTP -> name -> terms -> location -> payment -> address
  - Files: `src/navigation/OnboardingStack.tsx`, `src/navigation/AuthStack.tsx`, `src/screens/auth/*`

- Browse and search products
  - Needs: Logged in, store active, product active
  - Does: Category browse + search + sorting + advanced filters
  - Files: `src/screens/home/HomeScreen.tsx`, `src/screens/search/SearchScreen.tsx`, `src/screens/shop/CategoryResultsScreen.tsx`, `src/screens/shop/ProductResultsScreen.tsx`, `src/components/AdvancedFilterSheet.tsx`

- Add to cart and checkout
  - Needs: In-stock items, active store/product, required options selected
  - Does: Creates order and reserves stock
  - Files: `src/screens/shop/ProductOptionsScreen.tsx`, `src/screens/shop/MyCartScreen.tsx`, `src/screens/shop/CheckoutScreen.tsx`, `src/stores/cartStore.ts`, `src/stores/orderStore.ts`

- Track/cancel orders and answer substitutions
  - Needs: Existing order, valid status for action
  - Does: Timeline view, cancel with reason, accept/reject substitutions
  - Files: `src/screens/profile/OrderStatusScreen.tsx`, `src/components/CancelReasonModal.tsx`, `src/stores/orderStore.ts`

- Chat with driver and rate delivery
  - Needs: Valid order thread; usually after driver is assigned/out for delivery
  - Does: Shared chat thread, delivery rating, feedback, checklist
  - Files: `src/screens/customer/CustomerChatScreen.tsx`, `src/screens/profile/OrderResultScreen.tsx`, `src/stores/chatStore.ts`, `src/stores/driverStore.ts`

- Favourites, address, notifications
  - Needs: Logged in
  - Does: Save favourites, edit address, read customer notifications
  - Files: `src/screens/profile/MyFavouritesScreen.tsx`, `src/screens/profile/AddressScreen.tsx`, `src/screens/notifications/NotificationsScreen.tsx`

 Store Owner
- Sign in and open Store Owner app
  - Needs: `appRole = store_owner`, signed in
  - Does: Opens Dashboard, Orders, Products, Account
  - Files: `src/screens/storeOwner/StoreOwnerSignInScreen.tsx`, `src/navigation/StoreOwnerTabs.tsx`

- Manage order pipeline
  - Needs: Order in valid stage
  - Does: Accept/reject, mark preparing, mark ready, send to drivers
  - Files: `src/screens/storeOwner/StoreOwnerOrdersScreen.tsx`, `src/stores/orderStore.ts`

- Pick & pack
  - Needs: Open order detail
  - Does: Pack line items; blocks "Ready for Pickup" until all packed
  - Files: `src/screens/storeOwner/StoreOwnerOrderDetailScreen.tsx`, `src/stores/orderStore.ts`

- Propose substitutions
  - Needs: Open order line
  - Does: Proposes replacement item for customer approval
  - Files: `src/screens/storeOwner/StoreOwnerOrderDetailScreen.tsx`, `src/stores/orderStore.ts`

- Manage products
  - Needs: Signed in
  - Does: Add/edit/delete products, update stock, toggle active
  - Files: `src/screens/storeOwner/StoreOwnerProductsScreen.tsx`, `src/screens/storeOwner/StoreOwnerProductEditScreen.tsx`, `src/stores/productStore.ts`

- Read store-owner notifications
  - Needs: Signed in
  - Does: Shows store-owner scoped notifications
  - Files: `src/screens/storeOwner/StoreOwnerNotificationsScreen.tsx`, `src/stores/notificationStore.ts`

 Driver
- Sign in and open Driver app
  - Needs: `appRole = driver`, signed in
  - Does: Opens Home, Orders, Account
  - Files: `src/screens/driver/DriverSignInScreen.tsx`, `src/navigation/DriverTabs.tsx`

- Receive and act on delivery requests
  - Needs: Orders in `Driver Requested`
  - Does: Accept/decline, mark delivered, cancel delivery (guarded)
  - Files: `src/screens/driver/DriverOrdersScreen.tsx`, `src/screens/driver/DriverDeliveryDetailScreen.tsx`, `src/stores/driverOrdersStore.ts`, `src/stores/orderStore.ts`

- Delivery detail + customer contact/chat
  - Needs: Valid order
  - Does: View items/address/progress, call customer, chat
  - Files: `src/screens/driver/DriverDeliveryDetailScreen.tsx`, `src/screens/driver/DriverChatScreen.tsx`, `src/stores/chatStore.ts`

- Wallet and withdraw
  - Needs: Delivered orders for credits; enough balance to withdraw
  - Does: Credits delivery earnings once per order, shows transactions, handles withdraw request
  - Files: `src/screens/driver/DriverWalletScreen.tsx`, `src/stores/driverWalletStore.ts`

- Driver notifications/settings
  - Needs: Signed in
  - Does: Reads driver-scoped notifications, updates preferences
  - Files: `src/screens/driver/DriverNotificationsScreen.tsx`, `src/screens/driver/DriverSettingsScreen.tsx`

 Admin (Safe / Read-Heavy)
- Sign in and open Admin app
  - Needs: `appRole = admin`, signed in
  - Does: Opens Dashboard, Orders, Stores, Products, Account
  - Files: `src/screens/admin/AdminSignInScreen.tsx`, `src/navigation/AdminTabs.tsx`

- View system metrics and orders
  - Needs: Signed in
  - Does: KPI dashboard + order audit list + read-only order detail
  - Files: `src/screens/admin/AdminDashboardScreen.tsx`, `src/screens/admin/AdminOrdersScreen.tsx`, `src/screens/admin/AdminOrderDetailScreen.tsx`

- Soft-disable store or product
  - Needs: Signed in
  - Does: Toggle store/product active state only (no hard delete/status forcing)
  - Files: `src/screens/admin/AdminStoresScreen.tsx`, `src/screens/admin/AdminProductsScreen.tsx`, `src/stores/storeOwnerProfileStore.ts`, `src/stores/productStore.ts`

 Shared Core Features
- Scoped notifications with dedupe
  - Files: `src/stores/notificationStore.ts`

- Shared customer-driver chat per order
  - Files: `src/stores/chatStore.ts`, `src/screens/customer/CustomerChatScreen.tsx`, `src/screens/driver/DriverChatScreen.tsx`

- Peso currency formatting helper
  - Files: `src/utils/format.ts`

 Current Limits (from code)
- No dedicated Admin notification scope/UI yet (`notificationStore` supports only `customer`, `driver`, `store_owner`).
- Store model is currently single-store (`store-main`) not multi-store marketplace.
- Maps are placeholders, not live maps (`src/components/MapPlaceholder.tsx`).
- Wallet payout is mock/local only.
- Phone/chat/call are app-side UI flows only (no backend sync).

 Quick Demo Flow (Simple)
1. Customer places an order.
2. Store Owner accepts, prepares, packs, marks ready, sends to drivers.
3. Driver accepts and marks delivered.
4. Customer sees delivered result and rates delivery.
5. Admin views the same order in read-only audit screens.
