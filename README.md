# AP Pure Care — React Native E-Commerce App (Frontend Prototype)

A complete, **frontend-only** React Native (Expo + TypeScript) prototype of an Ayurvedic
e-commerce app: a full customer shopping journey plus a separate admin dashboard, all running
on realistic mock data. There is no backend, no database, no real payments, and no real
authentication — everything is designed so a real API can be plugged in later without
touching any screen code.

---

## 1. Quick Start

```bash
npm install
npx expo start
```

Then:
- Press `a` for Android emulator, `i` for iOS simulator (Mac only), `w` for web.
- Or scan the QR code with the **Expo Go** app on your phone (fastest way to see it on a real device).

Requirements: Node.js 18+ and npm. No native build tools needed — this runs entirely inside Expo Go / Metro.

---

## 2. Demo Logins (all mock — nothing is verified against a server)

| Flow | Credentials |
|---|---|
| Customer Login | Any email/mobile + a password of 4+ characters |
| Customer Register → OTP screen | OTP is always **`1234`** |
| Continue as Guest | No credentials needed, from the Welcome screen |
| Admin Login | `admin@ojas.com` / `admin123` (any valid-looking email + 4+ char password also works) |

The Admin panel is reached via a small, low-emphasis **"Admin Login"** text link at the very
bottom of the customer **Welcome** screen — it's intentionally de-emphasized since it's not a
customer-facing feature.

---

## 3. What's Implemented

### Customer App
- **Onboarding**: Splash → Onboarding carousel → Welcome (Login / Register / Continue as Guest)
- **Auth**: Login, Register, OTP Verification (all mock, session persisted via AsyncStorage)
- **Home**: hero banners, shop by category, shop by concern, best sellers, featured, new
  arrivals, offers, customer reviews, wellness articles, trust badges
- **Browse**: Categories grid, category product listing, filter & sort bottom sheets, search
  with recent/suggested searches
- **Product**: image gallery, variants, quantity, add to cart / buy now, wishlist, description /
  benefits / ingredients / how-to-use / product info / FAQs, ratings & reviews, related
  products, frequently bought together
- **Reviews**: rating distribution, filter by star rating, mark helpful, write a review
- **Cart**: quantities, save for later, coupon codes, price breakdown
- **Checkout**: address selection/add/edit, delivery method, payment method (UI only) → order
  placed
- **Orders**: confirmation, live-feeling status timeline, my orders (tabs), reorder, cancel
- **Account**: profile, addresses, my reviews, notifications, settings, help & support, wishlist,
  offers & coupons, Ayurveda articles + article detail
- **Search**, **Wishlist**, **Offers & Coupons**, **Ayurveda & Wellness articles** all fully wired

### Admin App (separate navigation stack, not mixed into customer nav)
Login → Dashboard (KPIs, sales trend, best sellers, recent orders/reviews) → Products (list/add/edit/delete)
→ Categories → Inventory (stock levels & quick adjust) → Orders (status update, cancel) →
Customers → Reviews (moderate) → Coupons (create/edit/delete) → Offers → Banners → Articles
(create/edit/delete) → Notifications (compose/broadcast, mock) → Analytics → Settings.

All admin screens share a left drawer (`AdminSidebarNav`) for quick navigation between sections.

---

## 4. Architecture

The app is layered so the mock data layer can be swapped for a real backend later without
touching any screen:

```
Screens  →  Reusable UI Components  →  Context/Hooks (state)  →  Repositories  →  Mock Data
```

- **`src/data/`** — raw mock data (19 Ayurvedic products, categories, reviews, orders, coupons,
  offers, articles, customers, addresses, banners). This is the only layer that will eventually
  be deleted/replaced.
- **`src/repositories/`** — `ProductRepository`, `CategoryRepository`, `OrderRepository`,
  `ReviewRepository`, `UserRepository`, `OfferRepository`, `ArticleRepository`,
  `CustomerRepository`, `AdminRepository`, `BannerRepository`. Every method is `async` and
  returns a `Promise` (with a small artificial delay), exactly like a real API call would.
  **This is the only place that needs to change to connect a real backend** — swap the body of
  each method for a `fetch()`/`axios` call with the same signature and every screen keeps working.
- **`src/context/`** — global app state: `AuthContext` (session), `CartContext` (cart + saved
  for later), `WishlistContext`, `CheckoutContext` (in-progress checkout selections).
- **`src/components/`** — ~30 reusable, themed UI components (ProductCard, CategoryCard,
  AppHeader, SearchBar, RatingStars, PriceDisplay, QuantitySelector, FilterBottomSheet,
  SortBottomSheet, OrderStatusTimeline, AddressCard, ArticleCard, CouponCard, EmptyState,
  LoadingState, ErrorState, ConfirmationDialog, AdminSidebarNav, etc.)
- **`src/theme/`** — the single source of truth for colors, typography, spacing, radius and
  shadows. No screen hardcodes a hex color or a raw pixel value.
- **`src/navigation/`** — `RootNavigator` (customer stack + the nested `AdminRoot`),
  `MainTabNavigator` (Home / Categories / Wishlist / Cart / Account tabs), `AdminNavigator`
  (separate stack for the whole admin app).

### Folder structure
```
src/
  theme/            colors.ts, typography.ts, spacing.ts (+ responsive helpers)
  types/            all shared TypeScript domain types (Product, Order, Review, ...)
  data/             mock data modules
  repositories/     the swappable data-access layer (async, API-shaped)
  context/          AuthContext, CartContext, WishlistContext, CheckoutContext
  components/       reusable, theme-driven UI building blocks
  navigation/       RootNavigator, MainTabNavigator, AdminNavigator, route types
  screens/
    auth/           Splash, Onboarding, Welcome, Login, Register, OTP
    home/           Home
    categories/     Categories grid, Category product listing
    product/        Product detail, Reviews, Write a review
    search/         Search
    cart/           Cart
    checkout/       Address, Add/Edit address, Delivery, Payment
    order/          Confirmation, Tracking, My Orders, Order details
    wishlist/       Wishlist
    offers/         Offers & Coupons
    articles/       Articles, Article detail
    account/        Profile, Addresses, My Reviews, Notifications, Settings, Help
    admin/          Login, Dashboard, Products, Categories, Inventory, Orders,
                    Customers, Reviews, Coupons, Offers, Banners, Articles,
                    Notifications, Analytics, Settings
```

---

## 5. Connecting a Real Backend Later

1. Keep every screen and component exactly as-is.
2. Open one file at a time in `src/repositories/`.
3. Replace the body of each method (which currently reads from `src/data/*` with an artificial
   delay) with a real network call that returns the same shape.
4. Delete `src/data/` once nothing references it anymore.

Nothing in `src/screens` or `src/components` imports `src/data` directly — they only ever talk
to repositories, so this swap is mechanical.

---

## 6. Known Limitations (by design — this is a frontend prototype)

- **No backend / no database** — all "persistence" (new orders, new products, cart, etc.) lives
  in in-memory arrays inside the repositories and resets when the app fully reloads.
- **No real authentication** — login/register/OTP accept any well-formed input; there is no
  password hashing, token, or server session.
- **No real payments** — the payment screen is UI-only; no card data is transmitted or stored
  anywhere.
- **Product/article images** are loaded from `picsum.photos` and `images.unsplash.com` as
  realistic-looking placeholders — an internet connection is required to see images. Swap these
  URLs for real product photography when a backend exists.
- **Article content** is written to be educational and deliberately avoids medical claims.

---

## 7. Tech Stack

- Expo (SDK 57) + React Native + TypeScript (strict mode)
- React Navigation (native-stack + bottom-tabs)
- React Context API for cart/wishlist/auth/checkout state (no Redux — not needed at this scale)
- `expo-image`, `expo-clipboard`, `@react-native-async-storage/async-storage`
- No charting library — the admin dashboard's sales trend/analytics bars are plain `View`s sized
  proportionally, keeping the dependency list minimal.
