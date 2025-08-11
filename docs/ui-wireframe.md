Nice — I’ll break this wireframe down into a developer-ready spec you can code directly. I’ll describe each screen, the components you need, exact data to show, state transitions, API calls, responsive notes, UX microcopy, and implementation tips (libraries, props, Tailwind classes). Treat this as the single-source-of-truth for building the frontend.

# Overview

This wireframe contains two main user flows and roles:

* **Customer (renter)**: catalog → listing detail → booking/quote → checkout/payment → order status.
* **Host / Admin**: dashboard → orders list → reservation calendar → pickup / return / inspection → invoicing & payouts.

Common UI pieces: global header, search/filter bar, listing cards, availability calendar, booking form, checkout summary (pricing + deposit + commission), admin order panels, and mobile-friendly variants.

---

# Global layout & shared components

These appear on pretty much every screen.

Header (desktop & mobile)

* Elements: logo (left), search field, filters (category/date), nav links: Home, My Bookings, Become Host, Host Dashboard (if host), Cart/Orders icon, Profile avatar (right).
* Behavior: sticky top, collapses to compact header on scroll.
* Accessibility: search input `aria-label="Search listings"`, profile menu keyboard accessible.

Footer

* Copyright, links: Terms, Privacy, Contact.

Global state & libs (recommended)

* React + TypeScript (strongly recommended).
* State & server cache: React Query (TanStack Query) for API data + caching.
* Forms: React Hook Form + Zod or Yup for validation.
* Date handling: date-fns (lightweight) or Day.js.
* Calendar: FullCalendar React or `react-big-calendar` for host calendar.
* Styling: TailwindCSS using the color tokens we agreed.

Shared components (implement once)

* `Header`, `Footer`, `Button`, `Input`, `Modal`, `Toast`, `Card`, `Skeleton`.
* `ListingCard` (grid item), `PriceBadge`, `HostBadge`.
* `DateRangePicker` (supports hour/day/week granularity).
* `AvailabilityIndicator` (green/yellow/red pill).
* `PriceBreakdown` (subtotal/deposit/commission/total).

---

# Page-by-page breakdown

## 1) Home / Catalog (grid view)

Purpose: browse listings, quick filter, show host trust info.

UI elements

* Top filters row: date range input, category dropdown, location input, price range slider.
* Grid of `ListingCard` showing thumbnail, title, price (per unit), host name + verified badge, small availability pill.
* Pagination or infinite scroll.
* Sidebar (desktop) with featured hosts / categories.

Data needed

* `GET /api/listings?from={}&to={}&q={}&category={}` returns: id, title, images\[0], basePrice, unitType, totalQuantity, owner.name, owner.verified, minAvailableQty (computed).

Interaction

* When user selects a date range, call availability endpoint or include `from/to` on listing fetch to show accurate availability.
* On hover show quick action: “Check availability” or “Book”.

Implementation notes

* ListingCard props: `{ id, title, image, priceLabel, unitType, hostName, hostVerified, availableQty }`
* Use skeletons while loading.

## 2) Listing Detail (single listing)

Purpose: detailed info, availability calendar, booking form.

Layout

* Left: image gallery carousel. Right: title, host card (with contact/verified), price per unit, small microcopy for deposit/late fee, CTA “Book Now / Check Availability”.
* Below: tabs — Details, Rules/Policies, Reviews, Q\&A.
* Side card: booking pane (sticky) with DateRangePicker, qty input, PriceBreakdown preview, CTA.

Key components

* `ImageCarousel` (lazy-load images).
* `HostCard` (host name, rating, verfied badge, contact button).
* `DateRangePicker` supporting hour/day/week modes depending on `unitType`.
* `AvailabilityIndicator` shows if requested date has enough qty.
* `PriceBreakdown` shows subtotal, deposit, platform commission, total.

APIs

* GET `/api/listings/:id`
* GET `/api/listings/:id/availability?start=&end=&qty=`

UX details

* When user changes dates/qty, do debounce 300ms and call availability check. Show spinner on button while calculating.
* If insufficient quantity show alt suggestions UI: “Only X available — choose different dates” and show next 3 available slots (call `/api/listings/:id/next-available?qty=&start=`).

Edge states

* If listing `status !== published` show “Unavailable” CTA (disabled) with tooltip.
* If host is unverified, show small warning copy: “Host not verified — inspection required”.

## 3) Booking / Quote flow (modal or dedicated page)

Purpose: convert listing selection into an order/quote ready for payment.

UI elements

* Summary card with listing small thumb, dates (start/end), qty, duration units computed, price breakdown.
* Option toggles: pay deposit (default) or full payment, show deposit % and amount.
* Input fields: renter contact info (if not logged in), promo code, special instructions.
* Terms & conditions checkbox (required).
* CTA: “Proceed to Pay” (primary) and “Request hold / Ask host” (secondary).

Behavior & validations

* Validate date range, qty ≤ available. Show errors inline.
* Recalculate price after promo code or payment option selected.
* Clicking Proceed → POST `/api/orders` to create order+reservations (server runs transaction), returns `orderId` and `razorpayOrderId` (or mock).
* On success open Razorpay checkout.

Microcopy examples

* “Deposit: ₹X (Y% of total) — refundable after inspection.”
* “You’ll be charged the full remaining amount after return/inspection.”

## 4) Checkout (payment)

Purpose: collect payment via Razorpay, show progress and final confirmation.

UI elements

* Embedded Razorpay modal (official widget) or mock modal in offline mode.
* Show exact line items and policy: cancellation/refund.
* Loading state while payment is being created / verifying.

Flow

* Client calls `POST /api/orders/:id/pay` → server creates Razorpay order and returns order info.
* Client initializes Razorpay checkout with `key_id` + `order_id`.
* On success: either client receives payment response and calls `/api/orders/:id/confirm-payment` *or* server receives webhook and updates order. Use both: client triggers confirm endpoint + server webhook double-checks idempotently.

UX notes

* After success show `Order Confirmed` screen with order number, host contact, pickup details.
* Provide “Download contract / invoice” button (generate PDF or route to printable page).

## 5) User Orders / My Bookings (customer portal)

Purpose: let renters manage orders (extend/cancel).

UI

* List with order cards: small info: listing thumb, dates, status pill (confirmed/active/late/completed), actions (view details, message host, cancel if allowed).
* Order detail page with timeline: Quote → Payment → Pickup → Active → Returned → Inspection → Completed. Each step has timestamps and actor who triggered it.

Actions

* Extend rental: propose new end date → runs availability check & create amendment order/reservation.
* Cancel: if allowed (based on policy) create refund flow.

APIs

* GET `/api/orders?userId=...`
* PATCH `/api/orders/:id/cancel` (server side handles refund as necessary).

## 6) Host Dashboard (host portal)

Purpose: host views listings, incoming bookings, calendar, pickup/return actions.

Layout

* Top nav for Host: Create Listing, My Listings, Orders, Calendar, Wallet.
* Panels: Today's pickups (list), Upcoming returns, Pending payouts, Quick stats (utilization %, upcoming revenue).
* Orders list: filter by status (new, confirmed, active, returned, disputed).
* Reservation calendar: each booking rendered as an event block; clicking opens Order Detail modal with action buttons (Mark Picked Up, Mark Returned, Flag Damage).

Components

* `HostListingRow` with quick edit, toggle published.
* FullCalendar integration: event color by status (reserved=blue, active=green, late=orange, disputed=red).
* `OrderDetailModal` shows renter contact, items, price breakdown, buttons to create pickup doc (PDF) and mark status.

APIs

* GET `/api/host/orders?hostId=...`
* POST `/api/orders/:id/pickup`
* POST `/api/orders/:id/return` (+ damage fees)

UX detail

* For pickup: allow uploading proof (image of handover or signature) and optional notes.
* For return with damage: show damage assessment modal where host adds fee; this creates a pending invoice or extra charge flow for renter.

## 7) Admin screens (right-side admin wireframes)

Purpose: staff intervenes on disputes, processes payouts, views reports.

UI elements

* Dashboard with tiles: Active Rentals, Late Returns, Revenue (period), Most rented.
* Orders table with inline filter, status chips, action buttons (refund, adjust fee, escalate).
* Payouts list with host, amount, status, process button.

Implementation notes

* Tables need sorting, CSV export.
* Show logs & audit trail on order details for judging: "Reservation transaction: txid ... commit".

## 8) Pickup / Return documents (paperwork screen)

These wireframes show a pickup/return document with itemized list, addresses, time slots, and sign-off area.

Important fields

* Pickup address, contact, scheduled datetime, items with serial numbers (if serialized), notes, signatures.
* Buttons: `Print`, `Download PDF`, `Mark Completed`.

APIs

* GET `/api/orders/:id/pickup-doc`
* POST `/api/orders/:id/pickup-complete` (accepts images/files)

UI detail

* On pickup, update reservation status to `picked` & create a log entry.
* On return, capture inspection result and attach images—if damage then create damage charge line item.

---

# Component tree & props (practical)

Top-level pages map to components. Use this as file/component plan.

```
App
 ├─ Header
 ├─ Routes
 │   ├─ HomePage
 │   │   └─ ListingGrid (ListingCard[])
 │   ├─ ListingDetailPage
 │   │   ├─ ImageCarousel(images)
 │   │   ├─ HostCard(host)
 │   │   ├─ BookingPane({ listing })
 │   │   └─ Tabs(Details, Rules, Reviews)
 │   ├─ BookingPage (optional)
 │   ├─ CheckoutPage
 │   ├─ OrdersPage (user)
 │   ├─ HostDashboard
 │   │   ├─ StatsCards
 │   │   ├─ OrdersList
 │   │   └─ ReservationCalendar
 │   └─ AdminPanel
 └─ Footer
```

`BookingPane` props

* `{ listing, initialStart, initialEnd }`
* Emits: `onRequestQuote({ start,end,qty,paymentOption })` → calls API.

`PriceBreakdown` props

* `{ subtotal, deposit, commission, taxes, total }`

`AvailabilityIndicator`

* `{ availableQty }` shows color: green (>=requested), orange (partial), red (0).

---

# Data & API mapping (exact)

### Listing summary

`GET /api/listings?from=&to=&q=`
response (per item)

```json
{
  "id":"abc",
  "title":"DJ Speaker",
  "image":"/img.jpg",
  "basePrice":600,
  "unitType":"day",
  "totalQuantity":3,
  "owner": { "id":"host1", "name":"Arun", "verified": true },
  "availableQty": 2
}
```

### Listing detail & availability

* `GET /api/listings/:id` returns full listing
* `GET /api/listings/:id/availability?start=&end=&qty=` returns `{available: true, availableQty: 2, suggestions: [...]}`

### Order creation

* `POST /api/orders` body:

```json
{ "renterId":"u1", "lines":[{ "listingId":"abc","qty":1,"start":"2025-08-11T10:00","end":"2025-08-13T18:00" }], "paymentOption":"deposit" }
```

response: `{ orderId, subtotal, depositAmount, totalAmount, razorpayOrderId (if created) }`

### Payment

* `POST /api/orders/:id/pay` → returns Razorpay order metadata.
* `POST /api/orders/:id/confirm-payment` → client posts razorpayPaymentId to confirm (server still relies on webhook too).

### Host actions

* `POST /api/orders/:id/pickup` with `{ proofFiles, notes }`
* `POST /api/orders/:id/return` with `{ inspectionPhotos, damageLines: [{desc,amount} ] }`

---

# UX transitions & state machine (important)

Order lifecycle:

1. `quote` (client created locally or server)
2. `reserved` (server creates Reservation objects; order created)
3. `pending_payment` (order created with reservation locked)
4. `paid` (payment succeeds) → `confirmed`
5. `picked` (host marks pickup) → `in_use`
6. `returned` (host marks returned) → `inspection`
7. `completed` (inspection ok) OR `disputed` (damage fee)

Front-end must reflect state and disable incompatible actions (e.g., cannot pick up until `paid`).

---

# Responsive notes (desktop → tablet → mobile)

* Mobile: collapse filters into a modal; listing grid becomes single column.
* Booking pane: on mobile, hide sticky; use bottom-sheet modal for booking/checkout (mimic mobile checkout flow).
* Calendar: show week view on tablet/mobile, month view on desktop. Allow event tap to open modal (not full page).

---

# Accessibility & microcopy

* All interactive elements must have `aria-label` attributes.
* Keyboard focus visible; escape closes modals.
* Form validation messages read by screen readers.
* Use clear microcopy: CTA “Book now”, secondary “Request hold”.
* Show policy links near CTA: “Cancellation policy” opens modal.

---

# Visual & Tailwind mapping (quick)

Use the theme tokens. Example Tailwind classes for primary CTA:

```html
<button class="bg-accent text-white font-semibold py-2 px-4 rounded-lg shadow hover:scale-[1.02] focus:ring-2 focus:ring-accent/50">Proceed to Pay</button>
```

Card:

```html
<div class="bg-card rounded-lg shadow-md p-4">
  <!-- content -->
</div>
```

Status pills:

* `reserved`: `bg-blue-100 text-blue-800`
* `paid/confirmed`: `bg-green-100 text-green-800`
* `late/disputed`: `bg-orange-100 text-orange-800` or `bg-red-100 text-red-800`

---

# Implementation tips & libraries

* React + TypeScript
* React Query for server state + optimistic updates (e.g., marking pickup quickly)
* React Hook Form + Zod for booking/checkout forms
* date-fns for duration math and rounding rules
* FullCalendar or react-big-calendar for host calendar (supports drag/drop)
* Use `axios` with interceptors that attach JWT
* For image uploads in demo: accept base64 or use local express endpoint that saves to `/uploads` (no S3 required)
* Debounce availability checks (`useDebouncedCallback` or `lodash.debounce`)

---

# Edge cases & what to show judges

* **Concurrency test**: two users attempt to book the last unit for same period. Show second attempt error: “Sorry, only 0 available for these dates — next available: Aug 15–Aug 18.”
* **Partial returns / multiple items**: if QTY>1 user returns some items earlier — reflect per-reservation status.
* **Failed payments**: show informative error & allow retry.
* **Overnight / timezone**: standardize times in UTC on server; display localized time on client with timezone label.

---

# Ready-to-implement checklist for frontend (in order)

1. Global shell: Header, Footer, Routing, Auth flow.
2. ListingGrid + ListingCard (with skeletons).
3. ListingDetail with ImageCarousel + BookingPane + Availability API.
4. Booking modal/page + PriceBreakdown component.
5. Checkout integration (Razorpay mock first).
6. Orders page & OrderDetail timeline.
7. Host Dashboard & ReservationCalendar (FullCalendar).
8. Pickup/Return flow including upload proof.
9. Admin payout & reports page.
10. Polish: microcopy, loading skeletons, keyboard accessibility.

---

If you want I’ll now:

* generate the exact component file templates (React + TSX) with props and API hooks for the top 6 components (ListingCard, ListingDetail, BookingPane, PriceBreakdown, Checkout, HostCalendar), or
* produce JSON example responses for all API endpoints so you can `mock` the frontend and design quickly.

Which do you want first?
