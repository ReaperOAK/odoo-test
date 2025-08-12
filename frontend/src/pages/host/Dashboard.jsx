import { useState, useEffect } from "react";
import { hostAPI, listingsAPI } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
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

const HostDashboard = () => {
  const { user } = useAuth();
  const { state, dispatch } = useData();
  const [activeTab, setActiveTab] = useState("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [hostListings, setHostListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [hostOrders, setHostOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!user?.isHost) return;

    setDashboardLoading(true);
    try {
      const response = await hostAPI.getDashboard();
      setDashboardData(response);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setDashboardLoading(false);
    }
  };

  const fetchHostListings = async () => {
    setListingsLoading(true);
    try {
      console.log('Attempting to fetch host listings...');
      const response = await hostAPI.getListings();
      console.log('Host listings response:', response);
      const listings = response?.data?.data?.listings || [];
      console.log('Parsed listings:', listings);
      setHostListings(listings);
    } catch (error) {
      console.error("Error fetching host listings:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    } finally {
      setListingsLoading(false);
    }
  };

  const fetchHostOrders = async () => {
    setOrdersLoading(true);
    try {
      const response = await hostAPI.getOrders();
      const orders = response?.data?.data?.orders || [];
      setHostOrders(orders);
    } catch (error) {
      console.error("Error fetching host orders:", error);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (user?.isHost) {
      fetchDashboardData();
      fetchHostListings();
      fetchHostOrders();
    }
  }, [user?.isHost]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log("Manual refresh triggered...");
      await Promise.all([
        fetchHostListings(),
        fetchDashboardData(),
        fetchHostOrders(),
      ]);
      console.log("Manual refresh completed");
    } finally {
      setIsRefreshing(false);
    }
  };

  console.log(
    "Dashboard render - hostListings:",
    hostListings?.length || 0,
    "listings"
  );
  console.log("Dashboard render - dashboard loading:", dashboardLoading);

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

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

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
          <Button
            variant="success"
            onClick={() => (window.location.href = "/profile")}
            className="text-white font-bold"
          >
            🌟 Upgrade to Host
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
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button onClick={() => (window.location.href = "/listings/new")}>
            <Plus className="h-4 w-4 mr-2" />
            List New Item
          </Button>
        </div>
      </div>

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
                  {dashboardLoading
                    ? "..."
                    : dashboardData?.data?.data?.stats?.totalListings || 0}
                </p>
              </div>
            </div>
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
                  {dashboardLoading
                    ? "..."
                    : formatPrice(
                        dashboardData?.data?.data?.stats?.monthlyRevenue || 0
                      )}
                </p>
              </div>
            </div>
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
                  Active Rentals
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardLoading
                    ? "..."
                    : dashboardData?.data?.data?.stats?.activeRentals || 0}
                </p>
              </div>
            </div>
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
                  Total Orders
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardLoading
                    ? "..."
                    : dashboardData?.data?.data?.stats?.totalOrders || 0}
                </p>
              </div>
            </div>
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
            {/* Recent Bookings */}
            <Card>
              <Card.Content className="p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
                {dashboardLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="animate-pulse bg-gray-200 h-16 rounded"
                      ></div>
                    ))}
                  </div>
                ) : dashboardData?.data?.data?.recentOrders?.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.data.data.recentOrders
                      .slice(0, 5)
                      .map((order) => (
                        <div
                          key={order._id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              {order.listingTitle || "Order"}
                            </p>
                            <p className="text-sm text-gray-600">
                              {order.renterName || "Customer"} •{" "}
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                order.orderStatus
                              )}`}
                            >
                              {order.orderStatus?.replace("_", " ") ||
                                "pending"}
                            </span>
                            <p className="text-sm font-medium mt-1">
                              {formatPrice(order.totalAmount || 0)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No orders yet.</p>
                )}
              </Card.Content>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <Card.Content className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Performance This Month
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Revenue</span>
                    <span className="font-medium">
                      {formatPrice(
                        dashboardData?.data?.data?.stats?.monthlyRevenue || 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Orders</span>
                    <span className="font-medium">
                      {dashboardData?.data?.data?.stats?.weeklyOrders || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Utilization Rate</span>
                    <span className="font-medium">
                      {dashboardData?.data?.data?.stats?.utilizationRate || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wallet Balance</span>
                    <span className="font-medium">
                      {formatPrice(
                        dashboardData?.data?.data?.stats?.walletBalance || 0
                      )}
                    </span>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>
        )}

        {activeTab === "listings" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listingsLoading ? (
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
                  onClick={() => (window.location.href = "/listings/new")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  List Your First Item
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="space-y-4">
            {ordersLoading ? (
              [...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-gray-200 h-24 rounded"
                ></div>
              ))
            ) : hostOrders?.length > 0 ? (
              hostOrders.map((order) => {
                return (
                  <Card key={order._id}>
                    <Card.Content className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              order.orderStatus
                            )}`}
                          >
                            {order.orderStatus?.replace("_", " ") || "pending"}
                          </span>
                          <span className="text-sm text-gray-500">
                            Order #{order.orderNumber || order._id?.slice(-8)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </div>
                      </div>

                      <div className="flex space-x-4">
                        <img
                          src="/placeholder-image.jpg"
                          alt="Order"
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">
                            Order Details
                          </h3>
                          <p className="text-sm text-gray-600">
                            Customer: {order.renterName || "N/A"}
                          </p>
                          <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                            <div>
                              <span className="text-gray-600">Created:</span>
                              <div>{formatDate(order.createdAt)}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Status:</span>
                              <div>{order.orderStatus || "pending"}</div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            {formatPrice(order.totalAmount || 0)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {order.paymentStatus === "paid"
                              ? "Paid"
                              : "Pending"}
                          </div>
                        </div>
                      </div>
                    </Card.Content>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No bookings yet
                </h3>
                <p className="text-gray-600">
                  Your bookings will appear here once customers start renting
                  your items.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "earnings" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <Card.Content className="p-6">
                <h3 className="text-lg font-semibold mb-4">Earnings Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Monthly Revenue</span>
                    <span className="font-semibold">
                      {formatPrice(
                        dashboardData?.data?.data?.stats?.monthlyRevenue || 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Total Orders</span>
                    <span className="font-semibold">
                      {dashboardData?.data?.data?.stats?.totalOrders || 0}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Pending Pickups</span>
                    <span className="font-semibold">
                      {dashboardData?.data?.data?.stats?.pendingPickups || 0}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Wallet Balance</span>
                    <span className="font-semibold text-green-600">
                      {formatPrice(
                        dashboardData?.data?.data?.stats?.walletBalance || 0
                      )}
                    </span>
                  </div>
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Content className="p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <p className="text-gray-600">No recent activity.</p>
                </div>
              </Card.Content>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default HostDashboard;
