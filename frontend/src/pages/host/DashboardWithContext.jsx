import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useListingsState } from "../../contexts/ListingsStateContext";
import {
  Plus,
  Calendar,
  DollarSign,
  Package,
  Users,
  Eye,
  RefreshCw,
} from "lucide-react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";

const HostDashboardWithContext = () => {
  const { user } = useAuth();
  const {
    hostListings,
    dashboardData,
    loading,
    error,
    lastUpdated,
    refreshAll,
    clearError,
  } = useListingsState();

  const [activeTab, setActiveTab] = useState("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatLastUpdated = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return formatDate(dateString);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      in_progress: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (!user?.isHost) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Become a Host
          </h1>
          <p className="text-gray-600 mb-6">
            Start earning by renting out your items to other users.
          </p>
          <Button onClick={() => (window.location.href = "/profile")}>
            Upgrade to Host
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Owner Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}!</p>
          {lastUpdated && (
            <p className="text-sm text-gray-500">
              Last updated: {formatLastUpdated(lastUpdated)}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing || loading.dashboard || loading.hostListings}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${
                isRefreshing || loading.dashboard || loading.hostListings
                  ? "animate-spin"
                  : ""
              }`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            onClick={() => (window.location.href = "/listings/new-context")}
          >
            <Plus className="h-4 w-4 mr-2" />
            List New Item (Context)
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex justify-between items-center">
            <p className="text-red-600 text-sm">{error.message}</p>
            <Button variant="outline" size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading.dashboard
                    ? "..."
                    : dashboardData?.stats?.totalListings ||
                      hostListings?.length ||
                      0}
                </p>
              </div>
            </div>
            {loading.dashboard && (
              <div className="mt-2">
                <div className="animate-pulse bg-gray-200 h-2 rounded"></div>
              </div>
            )}
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Earnings
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading.dashboard
                    ? "..."
                    : formatPrice(dashboardData?.stats?.totalEarnings || 0)}
                </p>
              </div>
            </div>
            {loading.dashboard && (
              <div className="mt-2">
                <div className="animate-pulse bg-gray-200 h-2 rounded"></div>
              </div>
            )}
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Active Bookings
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading.dashboard
                    ? "..."
                    : dashboardData?.stats?.activeBookings || 0}
                </p>
              </div>
            </div>
            {loading.dashboard && (
              <div className="mt-2">
                <div className="animate-pulse bg-gray-200 h-2 rounded"></div>
              </div>
            )}
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Customers
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading.dashboard
                    ? "..."
                    : dashboardData?.stats?.totalCustomers || 0}
                </p>
              </div>
            </div>
            {loading.dashboard && (
              <div className="mt-2">
                <div className="animate-pulse bg-gray-200 h-2 rounded"></div>
              </div>
            )}
          </Card.Content>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: "overview", label: "Overview" },
            { key: "listings", label: "My Items" },
            { key: "bookings", label: "Rentals" },
            { key: "earnings", label: "Earnings" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === key
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card>
              <Card.Content className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Performance This Month
                </h3>
                {loading.dashboard ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="animate-pulse bg-gray-200 h-6 rounded"
                      ></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Revenue</span>
                      <span className="font-medium">
                        {formatPrice(dashboardData?.monthlyStats?.revenue || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bookings</span>
                      <span className="font-medium">
                        {dashboardData?.monthlyStats?.bookings || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Rating</span>
                      <span className="font-medium">
                        {dashboardData?.stats?.averageRating
                          ? `${dashboardData.stats.averageRating.toFixed(1)} ⭐`
                          : "No ratings yet"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Response Rate</span>
                      <span className="font-medium">
                        {dashboardData?.stats?.responseRate || "100"}%
                      </span>
                    </div>
                  </div>
                )}
              </Card.Content>
            </Card>

            {/* Quick Stats */}
            <Card>
              <Card.Content className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                {loading.hostListings ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="animate-pulse bg-gray-200 h-6 rounded"
                      ></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Published Items</span>
                      <span className="font-medium">
                        {hostListings?.filter((l) => l.status === "published")
                          .length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Draft Items</span>
                      <span className="font-medium">
                        {hostListings?.filter((l) => l.status === "draft")
                          .length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Items</span>
                      <span className="font-medium">
                        {hostListings?.length || 0}
                      </span>
                    </div>
                  </div>
                )}
              </Card.Content>
            </Card>
          </div>
        )}

        {activeTab === "listings" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading.hostListings ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                  <div className="space-y-2">
                    <div className="bg-gray-300 h-4 rounded"></div>
                    <div className="bg-gray-300 h-4 rounded w-3/4"></div>
                  </div>
                </div>
              ))
            ) : hostListings?.length > 0 ? (
              hostListings.map((listing) => (
                <Card key={listing._id}>
                  <div className="relative">
                    <img
                      src={listing.images?.[0] || "/placeholder-image.jpg"}
                      alt={listing.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium ${
                          listing.status === "published"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {listing.status}
                      </span>
                    </div>
                  </div>
                  <Card.Content className="p-4">
                    <h3 className="font-semibold text-lg mb-2">
                      {listing.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {listing.location}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">
                        {formatPrice(listing.basePrice)}/{listing.unitType}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          (window.location.href = `/listings/${listing._id}`)
                        }
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </Card.Content>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No items listed yet
                </h3>
                <p className="text-gray-600 mb-6">
                  List your first item to start earning from rentals.
                </p>
                <Button
                  onClick={() =>
                    (window.location.href = "/listings/new-context")
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  List Your First Item
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Bookings Feature Coming Soon
            </h3>
            <p className="text-gray-600">
              This section will show your rental bookings and orders.
            </p>
          </div>
        )}

        {activeTab === "earnings" && (
          <div className="text-center py-12">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Earnings Analytics Coming Soon
            </h3>
            <p className="text-gray-600">
              This section will show detailed earnings analytics and reports.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HostDashboardWithContext;
