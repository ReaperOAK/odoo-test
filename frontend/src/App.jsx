import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/layout/Header';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ListingDetail from './pages/ListingDetail';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import CheckoutCancel from './pages/CheckoutCancel';
import MockCheckout from './pages/MockCheckout';
import MyBookings from './pages/MyBookings';
import Profile from './pages/Profile';
import CreateListing from './pages/CreateListing';
import HostDashboard from './pages/host/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/listings/:id" element={<ListingDetail />} />
                <Route path="/checkout/:orderId" element={<Checkout />} />
                <Route path="/checkout/success" element={<CheckoutSuccess />} />
                <Route path="/checkout/cancel" element={<CheckoutCancel />} />
                <Route path="/checkout/mock" element={<MockCheckout />} />
                <Route path="/my-bookings" element={<MyBookings />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/listings/new" element={<CreateListing />} />
                <Route path="/host/dashboard" element={<HostDashboard />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="*" element={<div className="text-center py-12"><h1 className="text-2xl font-bold">Page Not Found</h1></div>} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
