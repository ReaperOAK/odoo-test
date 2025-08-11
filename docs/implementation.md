# P2P Marketplace Implementation Plan

## Product Shift Summary

### Vendor (Host)
Any user can list items such as equipment, bikes, speakers.

### Customer (Renter)
Browses, requests booking, and pays.

### Platform
Handles payments, holds funds (escrow or platform wallet), optionally charges commission, and processes payouts to hosts (via Razorpay payouts or manually).

### Reservation & Fulfillment
Follows the original mockup: pickup/delivery, return, inspections, invoices — now per host listing.

### Key Implications
- Host onboarding/verification & profile.
- Commission & payout handling (escrow).
- Multi-owner inventory vs shared inventory (each listing owned by one host).
- Dispute flow & damage hold.

---

## High-Priority MVP (20 Hours)

### Core Features
1. **User Authentication & Onboarding**
   - Customer & host flag.

2. **Host Listing Creation**
   - Name, photos, unit type, quantity, price rules.

3. **Catalog & Search**
   - Filter by availability.

4. **Booking Request Flow**
   - Instant confirmation (atomic reservation).

5. **Payment Handling**
   - Razorpay payment by renter to platform (mockable offline).
   - Platform marks order as paid.

6. **Fund Holding**
   - Platform holds funds; shows pending payout to host.
   - Payout flow mocked for offline demo.

7. **Pickup/Return Status Updates**
   - Managed by host or admin.

8. **Calendar View**
   - For host/admin.

9. **Dispute/Damage Flagging**
   - Admin resolves.

10. **Local Demo**
    - Working with `PAYMENT_MODE=mock`.

### Bonus Features (if time permits)
- Host wallet & payout via Razorpay Payouts.

---

## Timeline (20 Hours, Two Developers)

### Developer Roles
- **Dev A**: Backend/Payments/DB.
- **Dev B**: Frontend/UX/Calendar + DevOps.

### Hour-by-Hour Plan

#### T0 — Prep (30m)
- Create repo + branches `main`, `dev`.
- Create `README_DEMO.md` with one-line run instructions.
- Copy `.env.example`.

#### T0.5–T1.5 — Backend Skeleton + DB (1 hour) (Dev A)
- Init Express + Mongoose.
- Connect to local Mongo (docker-compose).
- Create basic auth JWT skeleton.
- Create User model with `isHost` flag and basic seed script.

#### T1.5–T4.5 — Listing & Models + Reservation Engine (3 hrs) (Dev A)
- Implement Listing model, Reservation model, Order model, Payment model.
- Implement availability endpoint.
- Implement reservation engine with Mongo transactions.
- Add indexes.

#### T1.5–T4.5 — Frontend Basic UI & Tailwind Setup (3 hrs) (Dev B)
- Init Vite React + Tailwind.
- Build Product grid, Listing detail skeleton, booking form (dates qty).
- Wire API client `api.js`.

#### T4.5–T7.5 — Orders & Razorpay Integration (3 hrs) (Dev A)
- Implement `POST /orders` that runs reservation transaction + creates order and Razorpay order (or mock).
- Implement webhook `POST /webhook/razorpay` to verify signature and mark payment.
- Add PAYMENT_MODE env fallback to create fake payment & emit event.

#### T4.5–T7.5 — Booking UX + Checkout (3 hrs) (Dev B)
- Implement booking flow: select dates → check availability → create order → call backend to create Razorpay order → open Razorpay checkout (or mock modal) → on success call backend confirm payment endpoint.
- Show clear deposit vs full payment UI. Default: take 30% deposit.

#### T7.5–T10.5 — Host Dashboard + Calendar (3 hrs) (Dev B)
- Host panel shows listings, upcoming bookings, calendar (FullCalendar).
- Add ability to mark pickup/return, flag damage.

#### T7.5–T10.5 — Admin & Payouts Mock (3 hrs) (Dev A)
- Simple admin endpoint to view unpaid host balances.
- Implement mocked payout: mark payout processed (no Razorpay Payouts needed for demo).

#### T10.5–T13.5 — Polish + Seed Data + Tests (3 hrs) (Both)
- Seed 3 hosts, 5 listings, 5 customers.
- Unit test reservation conflict manually.
- Add skeleton loaders & toasts.

#### T13.5–T16 — Dockerize + Local Demo Mode (2.5 hrs) (Both)
- Add `docker-compose.yml` (frontend, backend, mongo).
- Ensure `PAYMENT_MODE=mock` default for offline.

#### T16–T18 — Edge Cases & Concurrency Test (2 hrs) (Both)
- Simulate concurrent bookings (2 windows) for last unit → must fail gracefully.
- Test timezone/overnight crossing.

#### T18–T20 — Deploy Locally, Rehearse Demo, Final Polish (2 hrs) (Both)
- Prepare demo script and 3 slides + GIFs.

---

## Folder Structure

### Backend
```
/backend
  /src
    /config
      index.js
    /controllers
      auth.controller.js
      listing.controller.js
      order.controller.js
      payment.controller.js
      host.controller.js
      admin.controller.js
    /models
      User.js
      Listing.js
      Reservation.js
      Order.js
      Payment.js
      Payout.js
    /services
      reservation.service.js
      pricing.service.js
      razorpay.service.js
      notification.service.js
    /routes
      auth.js
      listings.js
      orders.js
      payments.js
      admin.js
    /utils
      validator.js
      errors.js
      logger.js
    index.js
  package.json
  Dockerfile
  seed.js
  .env.example
```

### Frontend
```
/frontend
  /src
    /api
      client.js
      auth.js
      listings.js
      orders.js
    /components
      Header.jsx
      Footer.jsx
      ListingCard.jsx
      BookingForm.jsx
      Calendar.jsx
      RazorpayCheckout.jsx
      Toast.jsx
    /pages
      Home.jsx
      Listing.jsx
      Checkout.jsx
      HostDashboard.jsx
      AdminDashboard.jsx
    /styles
      tailwind.css
      theme.js
    App.jsx
    main.jsx
  package.json
  Dockerfile
  vite.config.js
```

---

## Database Schema (Mongoose-ready)

### User
```js
const UserSchema = new Schema({
  name: String,
  email: { type: String, unique: true, index: true },
  passwordHash: String,
  isHost: { type: Boolean, default: false },
  hostProfile: {
    displayName: String,
    verified: { type: Boolean, default: false },
    phone: String,
    address: String,
    govtIdUrl: String // optional for verification
  },
  walletBalance: { type: Number, default: 0 }, // platform-held amount payable to host
  role: { type: String, enum: ['user','host','admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});
```

### Listing
```js
const ListingSchema = new Schema({
  ownerId: { type: ObjectId, ref: 'User', index: true }, // host
  title: { type: String, required: true, index: true },
  description: String,
  images: [String],
  category: String,
  unitType: { type: String, enum: ['hour','day','week'], default: 'day' },
  basePrice: { type: Number, required: true }, // per unitType
  depositType: { type: String, enum: ['flat','percent'], default: 'percent' },
  depositValue: { type: Number, default: 20 }, // percent or amount
  totalQuantity: { type: Number, default: 1 },
  location: { type: String }, // city or geo
  status: { type: String, enum: ['draft','published','disabled'], default: 'published' },
  metadata: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});
ListingSchema.index({ title: 'text' });
```

### Reservation
```js
const ReservationSchema = new Schema({
  listingId: { type: ObjectId, ref: 'Listing', index: true },
  orderId: { type: ObjectId, ref: 'Order' },
  qty: { type: Number, default: 1 },
  start: { type: Date, required: true, index: true },
  end: { type: Date, required: true, index: true },
  status: { type: String, enum: ['reserved','picked','active','returned','cancelled'], default: 'reserved' },
  createdAt: { type: Date, default: Date.now }
});
ReservationSchema.index({ listingId: 1, start: 1, end: 1 });
```

### Order
```js
const OrderSchema = new Schema({
  renterId: { type: ObjectId, ref: 'User', index: true },
  hostId: { type: ObjectId, ref: 'User', index: true },
  lines: [{
    listingId: { type: ObjectId, ref: 'Listing' },
    qty: Number,
    start: Date,
    end: Date,
    unitPrice: Number,
    lineTotal: Number
  }],
  subtotal: Number,
  depositAmount: Number,
  platformCommission: Number, // calculated
  totalAmount: Number,
  paymentStatus: { type: String, enum: ['pending','paid','failed','refunded'], default: 'pending' },
  orderStatus: { type: String, enum: ['quote','confirmed','in_progress','completed','cancelled','disputed'], default: 'quote' },
  razorpayOrderId: String,
  createdAt: { type: Date, default: Date.now },
});
OrderSchema.index({ renterId: 1, hostId: 1, createdAt: -1 });
```

### Payment
```js
const PaymentSchema = new Schema({
  orderId: { type: ObjectId, ref: 'Order' },
  amount: Number,
  method: String, // 'razorpay' or 'mock'
  razorpayPaymentId: String,
  razorpayOrderId: String,
  status: { type: String, enum: ['initiated','success','failed'], default: 'initiated' },
  raw: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});
```

### Payout (host payments)
```js
const PayoutSchema = new Schema({
  hostId: { type: ObjectId, ref: 'User' },
  amount: Number,
  status: { type: String, enum: ['pending','processed','failed'], default: 'pending' },
  method: { type: String, enum: ['manual','razorpay_payout'], default: 'manual' },
  createdAt: { type: Date, default: Date.now }
});
```

---

## Reservation Algorithm (Transactional)

### Steps
1. Start a client session and transaction.
2. For each line (listing + qty + start + end):
   - Query overlapping reservations.
   - Check if requested quantity exceeds available quantity.
   - Insert Reservation document.
3. Insert Order document referencing reservations.
4. Commit transaction.

### Code Snippet
```js
async function createOrderAndReserve({ renterId, lines, paymentMode }, session) {
  const sessionLocal = session || await mongoose.startSession();
  try {
    sessionLocal.startTransaction();

    for (const line of lines) {
      const { listingId, qty, start, end } = line;
      const overlap = await Reservation.aggregate([
        { $match: {
            listingId: mongoose.Types.ObjectId(listingId),
            status: { $in: ['reserved','active','picked'] },
            $expr: { $and: [ { $lt: ['$start', new Date(end)] }, { $gt: ['$end', new Date(start)] } ] }
        }},
        { $group: { _id: null, totalQty: { $sum: '$qty' } } }
      ], { session: sessionLocal });

      const reservedQty = (overlap[0] && overlap[0].totalQty) ? overlap[0].totalQty : 0;
      const listing = await Listing.findById(listingId).session(sessionLocal);
      if (!listing) throw new Error('Listing not found');

      if (reservedQty + qty > listing.totalQuantity) {
        await sessionLocal.abortTransaction();
        throw { code: 409, message: 'Not enough items available' };
      }

      const reservation = new Reservation({
        listingId, qty, start, end, status: 'reserved'
      });
      await reservation.save({ session: sessionLocal });

      line.reservationId = reservation._id;
    }

    const order = new Order({
      renterId,
      hostId: lines[0].hostId || listing.ownerId,
      lines,
      subtotal: computeSubtotal(lines),
      depositAmount: computeDeposit(lines),
      platformCommission: computeCommission(lines),
      totalAmount: subtotalCalculation
    });
    await order.save({ session: sessionLocal });

    await Reservation.updateMany({ _id: { $in: lines.map(l=>l.reservationId) } },
                                { $set: { orderId: order._id } }, { session: sessionLocal });

    await sessionLocal.commitTransaction();
    return order;
  } catch (err) {
    if (sessionLocal.inTransaction()) await sessionLocal.abortTransaction();
    throw err;
  } finally {
    sessionLocal.endSession();
  }
}
```

---

## Razorpay Flow

### Steps
1. Renter pays platform via Razorpay Order.
2. On successful payment:
   - Create Payment record.
   - Update Order payment status to `paid`.
   - Increase host wallet balance.
3. Admin triggers payout mock.

### Security
- Verify webhook signature with HMAC using `RAZORPAY_SECRET`.

---

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Listings
- `GET /api/listings?from&to&query`
- `GET /api/listings/:id`
- `POST /api/listings` (host)
- `PATCH /api/listings/:id`

### Availability
- `GET /api/listings/:id/availability?start&end&qty`

### Orders
- `POST /api/orders`
- `POST /api/orders/:id/pay`
- `POST /api/orders/:id/confirm-payment`
- `GET /api/orders/:id`
- `POST /api/orders/:id/pickup`
- `POST /api/orders/:id/return`

### Payments/Webhook
- `POST /api/webhooks/razorpay`

### Admin/Payouts
- `GET /api/admin/payouts`
- `POST /api/admin/payouts/:id/process`

---

## Final Checklist

### Backend
- Models (User, Listing, Reservation, Order, Payment, Payout).
- Reservation service with transactions.
- Order creation + payment initiation + webhook.
- Payout mock + admin endpoints.
- Seed script + reset flag.
- Dockerfile + docker-compose.

### Frontend
- Tailwind & theme applied.
- Listing grid, listing detail, booking form.
- Razorpay checkout wrapper (with mock).
- Host Dashboard + Calendar.
- Admin simple panel + logs viewer.

### Polish & Ops
- README_DEMO with credentials & one-command run.
- Demo GIF + slides.
- Concurrency test logs ready.
- Postman collection (optional).

---

## Demo Script

### Steps
1. Problem one-liner: “Peer-to-peer rental marketplace — hosts list, renters book, platform holds payment escrow, host gets paid after completion.”
2. Show listing grid → select listing → show host badge + availability calendar.
3. Book: choose dates, qty; show price breakdown → checkout → success.
4. Switch to host dashboard: show new booking, calendar block, mark pickup → mark return, confirm inspection → show host wallet updated & admin payout pending.
5. Concurrency demo: open a second browser attempt on the same 1-unit slot, show graceful conflict.

---