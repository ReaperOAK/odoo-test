import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../ui/Button";
import { Menu, X, User, Home, Calendar, Settings, LogOut } from "lucide-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout, isAuthenticated, isHost, isAdmin } = useAuth();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  // Handle clicks outside the user menu and escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
        setIsMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsUserMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-transparent to-purple-50/30 pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="bg-blue-600 text-white rounded-xl p-2.5 shadow-lg group-hover:shadow-blue-500/50 transition-all duration-300">
              <Home className="h-6 w-6 lg:h-7 lg:w-7" />
            </div>
            <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              RentMarket
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 lg:space-x-12">
            <Link
              to="/"
              className="text-gray-700 hover:text-blue-600 font-medium text-sm lg:text-base transition-all duration-300 hover:scale-110 relative group"
            >
              Browse
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            {isAuthenticated && (
              <Link
                to="/my-bookings"
                className="text-gray-700 hover:text-blue-600 font-medium text-sm lg:text-base transition-all duration-300 hover:scale-110 relative group"
              >
                My Bookings
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            )}
            {isHost && (
              <Link
                to="/host/dashboard"
                className="text-gray-700 hover:text-blue-600 font-medium text-sm lg:text-base transition-all duration-300 hover:scale-110 relative group"
              >
                Owner Dashboard
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="text-gray-700 hover:text-blue-600 font-medium text-sm lg:text-base transition-all duration-300 hover:scale-110 relative group"
              >
                Admin
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 bg-white/80 hover:bg-white rounded-full px-3 py-2 lg:px-4 lg:py-2.5 transition-all duration-300 hover:scale-105 group shadow-md"
                >
                  <div className="bg-blue-600 text-white rounded-full p-1.5 group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-all duration-300">
                    <User className="h-4 w-4 lg:h-5 lg:w-5" />
                  </div>
                  <span className="hidden sm:block text-sm lg:text-base font-medium text-gray-700">
                    {user?.name || "User"}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 lg:w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                    <div className="py-2">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 rounded-lg mx-2"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Profile
                      </Link>
                      {isHost && (
                        <Link
                          to="/host/dashboard"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 rounded-lg mx-2"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Calendar className="h-4 w-4 mr-3" />
                          Owner Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-300 hover:scale-105 rounded-lg mx-2"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button
                  variant="glass"
                  onClick={() => navigate("/login")}
                  className="hover:scale-105 transition-transform duration-300 text-gray-900 font-semibold"
                >
                  🔑 Login
                </Button>
                <Button
                  variant="primary"
                  onClick={() => navigate("/register")}
                  className="animate-pulse-glow hover:scale-105 transition-transform duration-300 text-white font-bold"
                >
                  🚀 Sign Up
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-primary-500/10 transition-all duration-300 hover:scale-110"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-sm pt-4 pb-4">
            <div className="flex flex-col space-y-3">
              <Link
                to="/"
                className="px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium rounded-lg transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                Browse
              </Link>
              {isAuthenticated && (
                <Link
                  to="/my-bookings"
                  className="px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium rounded-lg transition-all duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Bookings
                </Link>
              )}
              {isHost && (
                <Link
                  to="/host/dashboard"
                  className="px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium rounded-lg transition-all duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Owner Dashboard
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="px-4 py-3 text-gray-700 hover:text-primary-600 hover:bg-primary-50 font-medium rounded-lg transition-all duration-300 hover:scale-105"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
