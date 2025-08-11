# Frontend TODO - P2P Marketplace MVP (20 Hours)

## T0 - T1.5: Project Setup & Foundation (1.5 hours)

### T0 - T0.5: Initial Setup (30 minutes)
- [ ] Initialize React TypeScript project with Vite
  - [ ] `npm create vite@latest frontend -- --template react-ts`
  - [ ] Install core dependencies: `react-router-dom`, `@tanstack/react-query`, `axios`, `react-hook-form`, `@hookform/resolvers`, `zod`
  - [ ] Install UI dependencies: `tailwindcss`, `@headlessui/react`, `@heroicons/react`, `lucide-react`
  - [ ] Install utility dependencies: `date-fns`, `clsx`, `tailwind-merge`
  - [ ] Setup Tailwind CSS with custom theme configuration
  - [ ] Create proper folder structure as per wireframe plan
  - [ ] Setup TypeScript strict configuration
  - [ ] Create `.env.example` for frontend environment variables

### T0.5 - T1.5: Core Infrastructure (1 hour)
- [ ] Setup React Query client with proper configuration
  - [ ] Create `src/lib/queryClient.ts` with defaults
  - [ ] Add error handling and retry logic
  - [ ] Setup devtools for development
- [ ] Create API client with Axios
  - [ ] `src/lib/api.ts` with base configuration
  - [ ] Request/response interceptors for auth tokens
  - [ ] Error response handling
  - [ ] Type-safe API endpoints
- [ ] Setup routing with React Router
  - [ ] `src/App.tsx` with route configuration
  - [ ] Protected routes for authenticated users
  - [ ] Role-based route protection (host/admin)
  - [ ] 404 and error boundary setup
- [ ] Create global state management
  - [ ] Auth context with user state
  - [ ] Toast/notification context
  - [ ] Theme context (if needed)
- [ ] Setup TypeScript types
  - [ ] `src/types/` folder with all interfaces
  - [ ] API response types
  - [ ] Form data types
  - [ ] Component prop types

## T1.5 - T4.5: Core UI Components & Design System (3 hours)

### T1.5 - T2.5: Shared Components (1 hour)
- [ ] Create base UI components (`src/components/ui/`)
  - [ ] `Button.tsx` - with variants (primary, secondary, danger, ghost)
  - [ ] `Input.tsx` - with validation states and icons
  - [ ] `Card.tsx` - with different elevations and padding
  - [ ] `Modal.tsx` - with backdrop, close handling, animations
  - [ ] `Toast.tsx` - with different types (success, error, info)
  - [ ] `Badge.tsx` - for status pills and labels
  - [ ] `Skeleton.tsx` - for loading states
  - [ ] `Spinner.tsx` - for inline loading
- [ ] Create layout components (`src/components/layout/`)
  - [ ] `Header.tsx` - with responsive navigation and user menu
  - [ ] `Footer.tsx` - with links and copyright
  - [ ] `Layout.tsx` - main layout wrapper with header/footer
  - [ ] `Sidebar.tsx` - for host/admin dashboards
- [ ] Setup Tailwind theme and design tokens
  - [ ] Custom color palette in `tailwind.config.js`
  - [ ] Typography scale and font families
  - [ ] Spacing scale and component sizing
  - [ ] Animation and transition utilities

### T2.5 - T4.5: Business Components (2 hours)
- [ ] Create listing components (`src/components/listing/`)
  - [ ] `ListingCard.tsx` - grid item with image, price, host info
  - [ ] `ListingGrid.tsx` - responsive grid with loading states
  - [ ] `ImageCarousel.tsx` - with thumbnails and navigation
  - [ ] `HostCard.tsx` - host profile with verification badge
  - [ ] `AvailabilityIndicator.tsx` - color-coded availability status
- [ ] Create booking components (`src/components/booking/`)
  - [ ] `DateRangePicker.tsx` - with hour/day/week support
  - [ ] `BookingForm.tsx` - with validation and real-time pricing
  - [ ] `PriceBreakdown.tsx` - detailed cost breakdown
  - [ ] `BookingPane.tsx` - sticky sidebar for booking
- [ ] Create form components (`src/components/forms/`)
  - [ ] `LoginForm.tsx` - with validation and error handling
  - [ ] `RegisterForm.tsx` - with host/customer toggle
  - [ ] `ListingForm.tsx` - multi-step listing creation
  - [ ] `ContactForm.tsx` - for host communication
- [ ] Create status components (`src/components/status/`)
  - [ ] `OrderStatusBadge.tsx` - color-coded order status
  - [ ] `Timeline.tsx` - order progress visualization
  - [ ] `ProgressBar.tsx` - for multi-step processes

## T4.5 - T7.5: Pages & Core User Flows (3 hours)

### T4.5 - T5.5: Authentication & Home (1 hour)
- [ ] Create authentication pages (`src/pages/auth/`)
  - [ ] `Login.tsx` - with form validation and error handling
  - [ ] `Register.tsx` - with host onboarding option
  - [ ] `ForgotPassword.tsx` - password reset flow
  - [ ] Implement auth context and hooks
- [ ] Create home page (`src/pages/Home.tsx`)
  - [ ] Hero section with search functionality
  - [ ] Featured listings grid
  - [ ] Category filters and search bar
  - [ ] Responsive design for mobile/tablet
- [ ] Implement search and filtering
  - [ ] URL-based filter state management
  - [ ] Debounced search input
  - [ ] Category and location filtering
  - [ ] Price range slider
  - [ ] Date availability filtering

### T5.5 - T7.5: Listing Detail & Booking Flow (2 hours)
- [ ] Create listing detail page (`src/pages/ListingDetail.tsx`)
  - [ ] Image carousel with lightbox functionality
  - [ ] Detailed listing information with tabs
  - [ ] Host profile section with contact options
  - [ ] Sticky booking pane with real-time availability
  - [ ] Reviews and Q&A sections (UI only for MVP)
- [ ] Implement booking flow
  - [ ] Date selection with availability checking
  - [ ] Quantity selection with constraints
  - [ ] Real-time price calculation
  - [ ] Booking form with user details
  - [ ] Terms and conditions acceptance
- [ ] Create checkout page (`src/pages/Checkout.tsx`)
  - [ ] Order summary with line items
  - [ ] Price breakdown (subtotal, deposit, commission, total)
  - [ ] Payment option selection (deposit vs full)
  - [ ] Contact information form
  - [ ] Razorpay integration component
- [ ] Add API integration for booking flow
  - [ ] Availability checking endpoint
  - [ ] Order creation endpoint
  - [ ] Payment initiation endpoint
  - [ ] Order confirmation endpoint

## T7.5 - T10.5: User Dashboard & Order Management (3 hours)

### T7.5 - T8.5: Customer Portal (1 hour)
- [ ] Create user orders page (`src/pages/user/Orders.tsx`)
  - [ ] Orders list with filtering (upcoming, past, cancelled)
  - [ ] Order cards with key information and actions
  - [ ] Order detail modal with full timeline
  - [ ] Action buttons (cancel, extend, contact host)
- [ ] Create order detail page (`src/pages/user/OrderDetail.tsx`)
  - [ ] Complete order information display
  - [ ] Status timeline with timestamps
  - [ ] Host contact information
  - [ ] Pickup/return instructions
  - [ ] Invoice download functionality
- [ ] Implement user profile management
  - [ ] Profile editing form
  - [ ] Booking history and statistics
  - [ ] Saved addresses and payment methods
  - [ ] Notification preferences

### T8.5 - T10.5: Host Dashboard (2 hours)
- [ ] Create host dashboard (`src/pages/host/Dashboard.tsx`)
  - [ ] Key metrics cards (utilization, revenue, bookings)
  - [ ] Today's pickups and returns
  - [ ] Recent orders with quick actions
  - [ ] Revenue chart (simple implementation)
- [ ] Create host listings management (`src/pages/host/Listings.tsx`)
  - [ ] Listings table with edit/delete actions
  - [ ] Quick listing creation form
  - [ ] Bulk actions for multiple listings
  - [ ] Status toggle (published/draft)
- [ ] Create host orders page (`src/pages/host/Orders.tsx`)
  - [ ] Orders table with advanced filtering
  - [ ] Status-based organization
  - [ ] Quick action buttons (pickup, return, contact)
  - [ ] Order detail modal with host actions
- [ ] Implement calendar view (`src/pages/host/Calendar.tsx`)
  - [ ] FullCalendar integration with reservations
  - [ ] Color-coded events by status
  - [ ] Event click for order details
  - [ ] Monthly, weekly, and daily views
  - [ ] Responsive calendar for mobile

## T10.5 - T13.5: Advanced Features & Polish (3 hours)

### T10.5 - T11.5: Razorpay Integration & Payment Flow (1 hour)
- [ ] Create Razorpay checkout component (`src/components/payment/RazorpayCheckout.tsx`)
  - [ ] Razorpay script loading and initialization
  - [ ] Payment modal with order details
  - [ ] Success/failure handling
  - [ ] Mock payment mode for demo
- [ ] Implement payment status handling
  - [ ] Payment success page with order confirmation
  - [ ] Payment failure page with retry option
  - [ ] Payment pending state management
  - [ ] Webhook status updates via polling or websockets
- [ ] Add payment security measures
  - [ ] Client-side signature verification
  - [ ] Payment amount validation
  - [ ] Fraud detection indicators
  - [ ] Secure token handling

### T11.5 - T12.5: Host Management Features (1 hour)
- [ ] Implement pickup/return workflow
  - [ ] Pickup confirmation modal with photo upload
  - [ ] Return inspection form with damage assessment
  - [ ] Status update notifications
  - [ ] Document generation (pickup/return receipts)
- [ ] Create host wallet management
  - [ ] Wallet balance display
  - [ ] Payout history and pending amounts
  - [ ] Payout request functionality
  - [ ] Transaction history with filters
- [ ] Add host communication features
  - [ ] Message system between host and renter
  - [ ] Automated status update messages
  - [ ] Contact information display with privacy controls

### T12.5 - T13.5: Admin Panel (1 hour)
- [ ] Create admin dashboard (`src/pages/admin/Dashboard.tsx`)
  - [ ] Platform statistics and metrics
  - [ ] Revenue overview and charts
  - [ ] User activity monitoring
  - [ ] System health indicators
- [ ] Create admin orders management (`src/pages/admin/Orders.tsx`)
  - [ ] All orders with advanced filtering
  - [ ] Dispute resolution interface
  - [ ] Refund processing tools
  - [ ] Order modification capabilities
- [ ] Create admin payout management (`src/pages/admin/Payouts.tsx`)
  - [ ] Pending payouts list
  - [ ] Payout processing interface
  - [ ] Payout history and reporting
  - [ ] Bulk payout operations
- [ ] Add admin user management
  - [ ] User list with roles and status
  - [ ] Host verification workflow
  - [ ] User account actions (suspend, verify)
  - [ ] Activity logs and audit trail

## T13.5 - T16: Responsive Design & Mobile Optimization (2.5 hours)

### T13.5 - T14.5: Mobile Responsiveness (1 hour)
- [ ] Optimize header for mobile
  - [ ] Collapsible navigation menu
  - [ ] Mobile search interface
  - [ ] Touch-friendly user menu
- [ ] Optimize listing grid for mobile
  - [ ] Single column layout
  - [ ] Swipeable listing cards
  - [ ] Mobile-optimized filters (bottom sheet)
- [ ] Optimize booking flow for mobile
  - [ ] Bottom sheet booking form
  - [ ] Mobile-friendly date picker
  - [ ] Simplified checkout process
  - [ ] Mobile payment interface
- [ ] Optimize dashboards for mobile
  - [ ] Collapsible sidebar navigation
  - [ ] Stacked card layouts
  - [ ] Touch-friendly action buttons
  - [ ] Mobile-optimized tables

### T14.5 - T16: Cross-browser & Accessibility (1.5 hours)
- [ ] Implement accessibility features
  - [ ] ARIA labels and roles for all interactive elements
  - [ ] Keyboard navigation support
  - [ ] Screen reader compatibility
  - [ ] Color contrast compliance (WCAG AA)
  - [ ] Focus management for modals and forms
- [ ] Cross-browser testing and fixes
  - [ ] Chrome, Firefox, Safari, Edge compatibility
  - [ ] Mobile browser testing (iOS Safari, Chrome Mobile)
  - [ ] CSS prefix handling for older browsers
  - [ ] JavaScript polyfills if needed
- [ ] Performance optimization
  - [ ] Code splitting for large components
  - [ ] Lazy loading for images and components
  - [ ] Bundle size optimization
  - [ ] Caching strategies for API responses
  - [ ] Loading state optimizations

## T16 - T18: Testing & Error Handling (2 hours)

### T16 - T17: Error Handling & Edge Cases (1 hour)
- [ ] Implement comprehensive error boundaries
  - [ ] Global error boundary for unexpected errors
  - [ ] Route-specific error boundaries
  - [ ] Fallback UI components for errors
  - [ ] Error reporting and logging
- [ ] Add form validation and error handling
  - [ ] Real-time validation with Zod schemas
  - [ ] Server error display and handling
  - [ ] Network error handling and retry logic
  - [ ] Validation error messages in forms
- [ ] Handle edge cases and loading states
  - [ ] Empty states for lists and data
  - [ ] Infinite scroll and pagination
  - [ ] Concurrent booking conflict handling
  - [ ] Network offline detection
  - [ ] Session expiry handling

### T17 - T18: User Experience Polish (1 hour)
- [ ] Add loading states and skeletons
  - [ ] Skeleton screens for all major components
  - [ ] Progressive loading for images
  - [ ] Optimistic updates for user actions
  - [ ] Loading indicators for async operations
- [ ] Implement smooth transitions and animations
  - [ ] Page transitions with React Router
  - [ ] Modal enter/exit animations
  - [ ] Button hover and click effects
  - [ ] Form validation animations
- [ ] Add user feedback mechanisms
  - [ ] Success/error toast notifications
  - [ ] Confirmation dialogs for destructive actions
  - [ ] Progress indicators for multi-step processes
  - [ ] Contextual help and tooltips

## T18 - T20: Final Polish & Demo Preparation (2 hours)

### T18 - T19: Final Testing & Bug Fixes (1 hour)
- [ ] End-to-end user flow testing
  - [ ] Complete customer booking journey
  - [ ] Host listing and order management
  - [ ] Admin panel functionality
  - [ ] Payment processing (mock mode)
- [ ] Cross-device testing
  - [ ] Desktop browser testing
  - [ ] Mobile device testing
  - [ ] Tablet layout verification
  - [ ] Different screen resolutions
- [ ] Performance testing and optimization
  - [ ] Page load speed optimization
  - [ ] Bundle size analysis
  - [ ] Runtime performance profiling
  - [ ] Memory leak detection
- [ ] Bug fixes and refinements
  - [ ] UI/UX inconsistencies
  - [ ] Form validation issues
  - [ ] Navigation and routing problems
  - [ ] API integration bugs

### T19 - T20: Demo Environment & Documentation (1 hour)
- [ ] Prepare demo environment
  - [ ] Environment configuration for demo
  - [ ] Demo user accounts and data
  - [ ] Mock payment setup verification
  - [ ] Demo script preparation
- [ ] Create user documentation
  - [ ] User guide for customers
  - [ ] Host onboarding guide
  - [ ] Admin panel documentation
  - [ ] Troubleshooting guide
- [ ] Final deployment preparation
  - [ ] Build optimization for production
  - [ ] Environment variable configuration
  - [ ] Docker setup for frontend
  - [ ] Deployment verification checklist

## Component Architecture & File Structure

### Core Component Hierarchy
```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── Badge.tsx
│   │   ├── Skeleton.tsx
│   │   └── Spinner.tsx
│   ├── layout/          # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Layout.tsx
│   │   └── Sidebar.tsx
│   ├── listing/         # Listing-related components
│   │   ├── ListingCard.tsx
│   │   ├── ListingGrid.tsx
│   │   ├── ImageCarousel.tsx
│   │   ├── HostCard.tsx
│   │   └── AvailabilityIndicator.tsx
│   ├── booking/         # Booking flow components
│   │   ├── DateRangePicker.tsx
│   │   ├── BookingForm.tsx
│   │   ├── PriceBreakdown.tsx
│   │   └── BookingPane.tsx
│   ├── forms/           # Form components
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── ListingForm.tsx
│   │   └── ContactForm.tsx
│   ├── payment/         # Payment components
│   │   ├── RazorpayCheckout.tsx
│   │   └── PaymentStatus.tsx
│   └── status/          # Status display components
│       ├── OrderStatusBadge.tsx
│       ├── Timeline.tsx
│       └── ProgressBar.tsx
├── pages/               # Route components
│   ├── auth/
│   ├── user/
│   ├── host/
│   ├── admin/
│   ├── Home.tsx
│   ├── ListingDetail.tsx
│   └── Checkout.tsx
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and configurations
├── types/               # TypeScript type definitions
└── styles/              # Global styles and Tailwind config
```

### Key TypeScript Interfaces
```typescript
// src/types/index.ts
export interface User {
  id: string;
  name: string;
  email: string;
  isHost: boolean;
  hostProfile?: HostProfile;
  role: 'user' | 'host' | 'admin';
  walletBalance: number;
}

export interface Listing {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  unitType: 'hour' | 'day' | 'week';
  basePrice: number;
  depositType: 'flat' | 'percent';
  depositValue: number;
  totalQuantity: number;
  location: string;
  status: 'draft' | 'published' | 'disabled';
  owner: User;
  availableQty?: number;
}

export interface Order {
  id: string;
  renterId: string;
  hostId: string;
  lines: OrderLine[];
  subtotal: number;
  depositAmount: number;
  platformCommission: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'quote' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  razorpayOrderId?: string;
  createdAt: string;
  renter: User;
  host: User;
}

export interface BookingFormData {
  start: Date;
  end: Date;
  quantity: number;
  paymentOption: 'deposit' | 'full';
  specialInstructions?: string;
  termsAccepted: boolean;
}
```

### API Hook Examples
```typescript
// src/hooks/useListings.ts
export const useListings = (filters: ListingFilters) => {
  return useQuery({
    queryKey: ['listings', filters],
    queryFn: () => api.listings.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// src/hooks/useCreateOrder.ts
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.orders.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};
```

### Responsive Design Breakpoints
```css
/* Tailwind custom breakpoints in tailwind.config.js */
module.exports = {
  theme: {
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    }
  }
}
```

### Environment Variables Required
```
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api
VITE_API_TIMEOUT=10000

# Razorpay Configuration
VITE_RAZORPAY_KEY_ID=your-razorpay-key-id
VITE_PAYMENT_MODE=mock

# App Configuration
VITE_APP_NAME=P2P Marketplace
VITE_APP_VERSION=1.0.0
VITE_DEMO_MODE=true

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_CHAT=false
```

### Critical Success Metrics
- [ ] Page load time < 3 seconds on 3G connection
- [ ] Mobile responsiveness across all screen sizes
- [ ] Accessibility score > 90 (Lighthouse)
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Error boundary coverage for all major components
- [ ] Form validation working for all user inputs
- [ ] Payment integration working in mock mode
- [ ] Calendar functionality working smoothly on all devices
