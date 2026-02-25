 ConstructGo - System Documentation (Defense-Ready)

 1) Executive Summary
- **ConstructGo** is a mobile app that digitizes hardware ordering and delivery workflows.
- It supports **four roles**: **Customer**, **Store Owner**, **Driver**, and **Admin**.
- Customers can browse products, use filters, add to cart, checkout, and track orders.
- Store Owners process orders, prepare/pack items, and hand off to Driver delivery.
- Drivers manage delivery execution and view wallet transactions/withdrawals.
- Admin provides read-heavy oversight for order monitoring and operational control.
- The demo is deployed as an **Android APK** using **Expo + EAS** for easy evaluator installation.

 2) Problem Statement & Objectives

 Problem Statement
- Hardware ordering is often manual (chat/call/spreadsheet), causing delays and miscommunication.
- Order handoff between store and delivery is not visible in real time.
- Product option pricing (for configurable items) is error-prone when computed manually.
- Stakeholders need one app where each role sees only the actions relevant to them.

 Objectives (Measurable)
- Enable complete role-based flow from order placement to delivery in one system.
- Reduce ordering friction by supporting search, filtering, and option-based products.
- Enforce pricing correctness using base price + option rules at checkout.
- Provide visible order progression with status updates for all involved roles.
- Maintain stable Android demo behavior for evaluation (APK install and run).

 3) Scope

 In Scope
- Role selection and role-gated app experience (Customer, Store Owner, Driver, Admin).
- Product catalog browsing, search, sorting, and advanced filtering.
- Product details with required options and computed pricing.
- Cart, checkout, order creation, and status-based tracking/result views.
- Notifications per role scope.
- Driver wallet: earnings view, transaction list, and withdrawal request.
- Admin oversight screens for order/store/product monitoring and soft controls.
- Android APK distribution via EAS internal build.

 Out of Scope
- Production backend integration and real-time server sync.
- Live payment gateway integration (beyond COD workflow representation).
- Full enterprise auth hardening (OAuth/SSO/MFA).
- Native map/route optimization with live GPS.
- Store-level multi-tenant backend operations and advanced analytics dashboards.

 4) Stakeholders & User Roles

 Customer
- **Responsibilities:** discover products, place orders, track status, confirm delivery.
- **Can do:** browse/search/filter, choose options, checkout, view order result, chat, rate.
- **Cannot do:** process store workflow, assign drivers, force status changes.

 Store Owner
- **Responsibilities:** validate and prepare incoming orders for dispatch.
- **Can do:** accept/reject, prepare/pack, update statuses, send to Driver queue.
- **Cannot do:** complete final delivery confirmation on behalf of Driver.

 Driver
- **Responsibilities:** accept delivery requests and complete deliveries.
- **Can do:** accept/decline, update delivery actions, communicate with customer, use wallet.
- **Cannot do:** edit store preparation stages or admin controls.

 Admin
- **Responsibilities:** monitor operations and apply safe controls.
- **Can do:** view KPI/order oversight, soft-enable/disable stores/products.
- **Cannot do:** bypass lifecycle guardrails or directly force unsafe order transitions.

 5) End-to-End User Flow (Short but Complete)

 Customer Flow
1. Browse/Search products.
2. Apply filters/sort to narrow results.
3. Open product details.
4. If item requires options (example: nails size), select required option first.
5. Add to cart and checkout.
6. Track status updates until delivered/cancelled.
7. View order result and post-delivery actions (verification/rating).

 Store Owner Flow
1. Receive incoming order.
2. Accept order and move to preparation.
3. Pack items and update readiness.
4. Update statuses through store-side phases.
5. Send order to Driver request queue.

 Driver Flow
1. Accept delivery request.
2. Pick up and complete delivery steps.
3. Mark delivered.
4. View wallet earnings and transactions; request withdrawal.

 Admin Flow
1. Monitor order pipeline and status distribution.
2. Inspect order details for audit/oversight.
3. Apply soft operational controls (store/product enable/disable).

 6) Key Features (Grouped by Role)

 Customer
- Product browsing and keyword search.
- Advanced filtering:
  - price range
  - minimum rating
  - COD-only
  - in-stock-only
  - category subset (search results)
- Sort modes:
  - Best Match
  - Best Seller
  - Price (ascending/descending)
- Required product options before add-to-cart.
- COD badge visibility on eligible products.
- Cart/checkout with computed totals and status tracking.

 Store Owner
- Incoming order management.
- Pack/prepare workflow support.
- Status updates from store-side stages to Driver handoff.
- COD-aware operational handling in order records.

 Driver
- Delivery request queue and acceptance.
- Delivery progression actions.
- Role-scoped notifications.
- Wallet overview, transactions, and withdrawal request flow.

 Admin
- Read-heavy operational dashboard.
- Order monitoring and detail audit.
- Soft controls over store/product visibility and availability.

 7) System Architecture (High Level)

 Explanation
- This demo runs as a **client-centric mobile app** with persisted local state.
- UI screens call navigation actions and store actions.
- Stores hold app state and business rules for each role.
- Seed data/models provide product/order references for demonstration.

 ASCII Diagram
```text
[UI Screens]
   |
   v
[Role-based Navigation]
(Root -> Role -> Stacks/Tabs)
   |
   v
[State Stores]
(order, product, cart, filters, notifications, wallet, auth)
   |
   v
[Seed Data / Models]
(products, options, statuses, transactions)
```

 8) Data Model (Simple)

 Core Entities
- **User**
  - id, role, name, contact, auth state
- **Product**
  - id, name, category, basePrice, rating, stock, codAvailable, images
- **ProductOptionGroup**
  - id, productId, label, required
- **ProductOption**
  - id, optionGroupId, label, priceDelta
- **CartItem**
  - id, productId, qty, selectedOptions[]
- **Order**
  - id, customerId, items[], subtotal, deliveryFee, total, status, timestamps
- **OrderStatus**
  - Pending, Processing, Preparing, Ready for Pickup, Driver Requested, Out for Delivery, Delivered, Cancelled
- **Notification**
  - id, scope, title, message, timestamp, readFlag
- **WalletTransaction**
  - id, driverId, type (credit/debit), amount, timestamp, reference

 Relationships
- A **Product** can have many **ProductOptionGroups**.
- An **OptionGroup** can have many **Options**.
- A **CartItem** references one Product and selected options.
- An **Order** has many order items.
- Each order item may include selected options.
- **Driver wallet transactions** link to completed delivery activity.

 9) Pricing & Rules

 Pricing Rule
- Final item price is computed as:
  - **base price + selected option delta(s)**

 Example: Steel Nails (Per Kilo)
- Required option: **Size**
- Price behavior:
  - Size 1 = P65 / kilo
  - Size 2 = P65 / kilo
  - Size 3 = P60 / kilo
  - Size 4 = P50 / kilo
  - Size 5 = P50 / kilo

 Guard Rule
- If required options are not selected, add-to-cart is blocked with user feedback.

 10) Filtering & Sorting Logic (Defense-Friendly)

 Filters
- **Price range:** min/max product price filtering.
- **Minimum rating:** only show products at or above threshold.
- **COD-only:** show COD-eligible products.
- **In-stock-only:** hide out-of-stock items.
- **Category subset:** available on search results for multi-category narrowing.

 Sorting
- **Best Match:** original listing order.
- **Best Seller:** descending by soldCount.
- **Price:** ascending or descending.

 11) Testing Plan (User Flow Testing)

 Customer
- [ ] Search product and open details.
- [ ] Try adding required-option item without option -> blocked.
- [ ] Select required option -> add-to-cart succeeds.
- [ ] Checkout creates order and tracking is visible.

 Store Owner
- [ ] Incoming order appears.
- [ ] Accept/preparing flow works.
- [ ] Status updates reflect in order list.

 Driver
- [ ] Delivery request appears.
- [ ] Accept and complete delivery updates status.
- [ ] Wallet reflects delivery transaction.

 Admin
- [ ] Orders are visible in monitoring screens.
- [ ] Soft controls toggle availability without breaking existing records.

 Edge Cases
- [ ] Required option missing -> prevent add-to-cart.
- [ ] minPrice > maxPrice -> normalized/swap behavior.
- [ ] Out-of-stock hidden when in-stock filter is enabled.
- [ ] COD-only filter shows only COD-eligible products.

 12) Deployment & Demo Setup

 Deployment Decision
- Android demo APK built via **EAS internal distribution**.
- Stability-focused build choices:
  - **Hermes enabled**
  - **New architecture disabled**

 Install (Demo)
1. Build/download APK from EAS internal distribution.
2. Install on Android device (allow unknown apps if required).
3. Launch app and start from role selection.

 Common Issues
- If app exits on launch, rebuild with clean cache and reinstall latest APK.
- If logs are needed, capture ADB logcat and check runtime/fatal error lines.

 13) Limitations & Future Enhancements

 Current Limitations
- No production backend synchronization.
- No real payment gateway processing.
- Limited advanced auth hardening.
- Map/location and routing are not full live logistics systems.
- Analytics/reporting depth is limited for production operations.

 Future Enhancements
- Backend API + database with real-time sync.
- Full inventory and warehouse integration.
- Secure role-based auth (token lifecycle, hardened sessions).
- Live tracking and route optimization.
- Business analytics dashboards and audit exports.

 14) Demo Script (2-4 Minutes)

 0:00-0:45 - Customer Discovery & Filtering
- **Say:** "This is ConstructGo�s customer experience for hardware ordering."
- **Do:** Open Customer role -> Search for "nails" -> open advanced filters -> apply rating/COD/in-stock filters.

 0:45-1:30 - Product Option & Checkout
- **Say:** "This product requires option selection before cart."
- **Do:** Open **Steel Nails (Per Kilo)** -> select Size -> add to cart -> checkout.

 1:30-2:15 - Store Owner Processing
- **Say:** "Store Owner receives and prepares the order for delivery."
- **Do:** Switch to Store Owner -> accept and update order stages -> send to Driver queue.

 2:15-3:00 - Driver Delivery + Wallet
- **Say:** "Driver executes delivery and earnings are tracked."
- **Do:** Switch to Driver -> accept request -> mark delivered -> open wallet/transactions.

 3:00-3:30 - Customer Result
- **Say:** "Customer receives final status with confirmation details."
- **Do:** Switch back to Customer -> open order result -> show delivered status and rating step.

 3:30-4:00 - Admin Oversight
- **Say:** "Admin monitors the same flow without bypassing operational guardrails."
- **Do:** Switch to Admin -> open orders overview/detail and highlight read-heavy control.
