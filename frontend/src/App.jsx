import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { DataProvider } from "./contexts/DataContext";
import Header from "./components/layout/Header";

// Pages
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ListingDetail from "./pages/ListingDetail";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";
import MockCheckout from "./pages/MockCheckout";
import MyBookings from "./pages/MyBookings";
import Profile from "./pages/Profile";
import CreateListing from "./pages/CreateListing";
import HostDashboard from "./pages/host/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";

function App() {
  return (
    <DataProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
              <div className="absolute top-40 left-1/2 w-60 h-60 bg-gradient-to-r from-green-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
            </div>

            <Header />
            <main className="relative z-10">
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
                <Route
                  path="*"
                  element={
                    <div className="text-center py-12">
                      <div className="slide-up">
                        <h1 className="text-responsive-xl font-bold gradient-text mb-4">
                          Page Not Found
                        </h1>
                        <p className="text-gray-600 mb-8">
                          The page you're looking for doesn't exist.
                        </p>
                        <button className="btn-flashy text-white px-8 py-3 rounded-full font-semibold shadow-lg">
                          Go Home
                        </button>
                      </div>
                    </div>
                  }
                />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </DataProvider>
  );
}

export default App;
