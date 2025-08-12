import { useState, useEffect } from "react";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import UserManagementModal from "../../components/admin/UserManagementModal";
import UserDetailsModal from "../../components/admin/UserDetailsModal";
import OrderDetailsModal from "../../components/admin/OrderDetailsModal";
import PayoutManagementModal from "../../components/admin/PayoutManagementModal";
import ExportModal from "../../components/admin/ExportModal";
import {
  exportData,
  generateAdminReport,
  printAdminDashboard,
  printOrders,
  printUsers,
  printPayouts,
} from "../../utils/exportUtils";

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const { state, actions } = useData();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  // Export modal states
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState("");
  const [exportData, setExportData] = useState(null);

  const refreshData = () => {
    // Refresh data based on current tab
    if (selectedTab === "overview") {
      actions.fetchAdminStats();
    } else if (selectedTab === "users") {
      actions.fetchAdminUsers();
    } else if (selectedTab === "orders") {
      actions.fetchAdminOrders();
    } else if (selectedTab === "payouts") {
      actions.fetchAdminPayouts();
    } else if (selectedTab === "reports") {
      actions.fetchAdminAnalytics();
    }
  };

  const handleGenerateReport = async () => {
    try {
      // Ensure we have dashboard data
      if (!dashboardData?.data?.data) {
        alert(
          "Dashboard data not available. Please wait for data to load and try again."
        );
        return;
      }

      // Create comprehensive report data
      const reportData = {
        generatedAt: new Date().toISOString(),
        period: "30 days",
        stats: dashboardData.data.data.stats || {},
        recentOrders: dashboardData.data.data.recentOrders || [],
        topListings: dashboardData.data.data.topListings || [],
        analytics: analyticsData?.data?.data || {},
      };

      setExportData(reportData);
      setExportType("report");
      setShowExportModal(true);
    } catch (error) {
      console.error("Error preparing report:", error);
      alert("Failed to prepare report. Please try again.");
    }
  };

  const handleExportData = async (format) => {
    try {
      if (exportType === "report") {
        generateAdminReport(exportData, format);
      } else if (exportType === "users") {
        const users = usersData?.data?.data || [];
        const headers = [
          "name",
          "email",
          "role",
          "isHost",
          "isVerified",
          "createdAt",
        ];
        const processedUsers = users.map((user) => ({
          name: user.name,
          email: user.email,
          role:
            user.role === "admin" ? "Admin" : user.isHost ? "Host" : "Customer",
          isHost: user.isHost ? "Yes" : "No",
          isVerified: user.isVerified ? "Verified" : "Pending",
          createdAt: new Date(user.createdAt).toLocaleDateString(),
        }));
        const date = new Date().toISOString().split("T")[0];
        exportData(
          processedUsers,
          headers,
          `users-export-${date}`,
          format,
          "User Data Export"
        );
      } else if (exportType === "orders") {
        const orders = ordersData?.data?.data || [];
        const headers = [
          "orderId",
          "customer",
          "total",
          "status",
          "paymentStatus",
          "createdAt",
        ];
        const processedOrders = orders.map((order) => ({
          orderId: order._id,
          customer: order.customer?.name || "N/A",
          total: `₹${order.total || 0}`,
          status: order.orderStatus,
          paymentStatus: order.paymentStatus,
          createdAt: new Date(order.createdAt).toLocaleDateString(),
        }));
        const date = new Date().toISOString().split("T")[0];
        exportData(
          processedOrders,
          headers,
          `orders-export-${date}`,
          format,
          "Orders Data Export"
        );
      } else if (exportType === "payouts") {
        const payouts = payoutsData?.data?.data?.payouts || [];
        const headers = ["payoutId", "host", "amount", "status", "createdAt"];
        const processedPayouts = payouts.map((payout) => ({
          payoutId: payout._id,
          host: payout.host?.name || "N/A",
          amount: `₹${payout.amount || 0}`,
          status: payout.status,
          createdAt: new Date(payout.createdAt).toLocaleDateString(),
        }));
        const date = new Date().toISOString().split("T")[0];
        exportData(
          processedPayouts,
          headers,
          `payouts-export-${date}`,
          format,
          "Payouts Data Export"
        );
      } else if (exportType === "revenue") {
        const analytics = analyticsData?.data?.data || {};
        const revenueData = analytics.revenueOverTime || [];
        const headers = ["date", "revenue", "orders"];
        const processedRevenue = revenueData.map((item) => ({
          date: new Date(
            item._id.year,
            item._id.month - 1,
            item._id.day
          ).toLocaleDateString(),
          revenue: `₹${item.revenue?.toLocaleString() || 0}`,
          orders: item.orders || 0,
        }));
        const date = new Date().toISOString().split("T")[0];
        exportData(
          processedRevenue,
          headers,
          `revenue-report-${date}`,
          format,
          "Revenue Analytics Report"
        );
      } else if (exportType === "payout-report") {
        const payouts = payoutsData?.data?.data?.payouts || [];
        const headers = [
          "host",
          "email",
          "amount",
          "currency",
          "status",
          "method",
          "createdAt",
          "bankAccount",
        ];
        const processedPayouts = payouts.map((payout) => ({
          host: payout.hostId?.name || "N/A",
          email: payout.hostId?.email || "N/A",
          amount: `₹${payout.amount || 0}`,
          currency: payout.currency || "INR",
          status: payout.status || "N/A",
          method: payout.method || "N/A",
          createdAt: new Date(payout.createdAt).toLocaleDateString(),
          bankAccount: payout.bankDetails?.accountNumber || "N/A",
        }));
        const date = new Date().toISOString().split("T")[0];
        exportData(
          processedPayouts,
          headers,
          `payout-report-${date}`,
          format,
          "Payout Report Export"
        );
      }

      alert(`${format.toUpperCase()} file downloaded successfully!`);
    } catch (error) {
      console.error("Error exporting data:", error);
      throw error;
    }
  };

  // Simplified export trigger functions
  const exportUserData = () => {
    const users = usersData?.data?.data || [];
    if (users.length === 0) {
      alert("No user data available to export.");
      return;
    }
    setExportData(users);
    setExportType("users");
    setShowExportModal(true);
  };

  const exportOrderData = () => {
    const orders = ordersData?.data?.data || [];
    if (orders.length === 0) {
      alert("No order data available to export.");
      return;
    }
    setExportData(orders);
    setExportType("orders");
    setShowExportModal(true);
  };

  const exportPayoutData = () => {
    const payouts = payoutsData?.data?.data?.payouts || [];
    if (payouts.length === 0) {
      alert("No payout data available to export.");
      return;
    }
    setExportData(payouts);
    setExportType("payouts");
    setShowExportModal(true);
  };

  const exportRevenueReport = () => {
    const analytics = analyticsData?.data?.data || {};
    if (!analytics.revenueOverTime || analytics.revenueOverTime.length === 0) {
      alert("No revenue data available to export.");
      return;
    }
    setExportData(analytics);
    setExportType("revenue");
    setShowExportModal(true);
  };

  const exportPayoutReport = () => {
    const payouts = payoutsData?.data?.data?.payouts || [];
    if (payouts.length === 0) {
      alert("No payout report data available to export.");
      return;
    }
    setExportData(payouts);
    setExportType("payout-report");
    setShowExportModal(true);
  };

  // Print handler functions
  const handlePrintDashboard = () => {
    const dashboardStats = dashboardData?.data?.data;
    if (!dashboardStats) {
      alert(
        "Dashboard data not available. Please wait for data to load and try again."
      );
      return;
    }
    printAdminDashboard(dashboardStats);
  };

  const handlePrintUsers = () => {
    const users = usersData?.data?.data || [];
    if (users.length === 0) {
      alert("No user data available to print.");
      return;
    }
    printUsers(users);
  };

  const handlePrintOrders = () => {
    const orders = ordersData?.data?.data || [];
    if (orders.length === 0) {
      alert("No order data available to print.");
      return;
    }
    printOrders(orders);
  };

  const handlePrintPayouts = () => {
    const payouts = payoutsData?.data?.data?.payouts || [];
    if (payouts.length === 0) {
      alert("No payout data available to print.");
      return;
    }
    printPayouts(payouts);
  };

  // Old export functions removed - now using modal-based multi-format export system

  // Fetch admin dashboard data
  // Fetch data based on selected tab
  useEffect(() => {
    if (!isAdmin) return;

    if (selectedTab === "overview") {
      actions.fetchAdminStats();
    } else if (selectedTab === "users") {
      actions.fetchAdminUsers();
    } else if (selectedTab === "orders") {
      actions.fetchAdminOrders();
    } else if (selectedTab === "payouts") {
      actions.fetchAdminPayouts();
    } else if (selectedTab === "reports") {
      actions.fetchAdminAnalytics();
    }
  }, [selectedTab, isAdmin]); // Remove actions from dependency array

  // Extract data from state
  const dashboardData = { data: { data: state.adminStats } };
  const dashboardLoading = state.adminLoading;
  const dashboardError = state.adminError;

  const usersData = { data: { data: state.adminUsers } };
  const usersLoading = state.adminLoading;

  const ordersData = { data: { data: state.adminOrders } };
  const ordersLoading = state.adminLoading;

  const payoutsData = { data: { data: state.adminPayouts } };
  const payoutsLoading = state.adminLoading;

  const analyticsData = { data: { data: state.adminAnalytics } };
  const analyticsLoading = state.adminLoading;

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserDetailsModal(true);
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleManagePayout = (payout) => {
    setSelectedPayout(payout);
    setShowPayoutModal(true);
  };

  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 p-6 rounded-lg text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Access Denied
          </h2>
          <p className="text-red-600">
            You don't have permission to access the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "orders", label: "Orders", icon: "📦" },
    { id: "payouts", label: "Payouts", icon: "💰" },
    { id: "reports", label: "Reports", icon: "📈" },
  ];

  const StatCard = ({ title, value, icon, trend, trendValue }) => (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p
              className={`text-sm ${
                trend === "up" ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend === "up" ? "↗" : "↘"} {trendValue}
            </p>
          )}
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </Card>
  );

  const renderOverview = () => {
    if (dashboardLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-32 rounded-lg"></div>
            </div>
          ))}
        </div>
      );
    }

    if (dashboardError) {
      return (
        <div className="bg-red-50 p-6 rounded-lg">
          <p className="text-red-600">Failed to load dashboard data</p>
        </div>
      );
    }

    const stats = dashboardData?.data?.data?.stats || {};
    const recentOrders = dashboardData?.data?.data?.recentOrders || [];
    const topListings = dashboardData?.data?.data?.topListings || [];

    return (
      <div className="space-y-6">
        {/* Dashboard Actions */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Dashboard Overview
          </h2>
          <div className="flex space-x-2">
            <Button variant="glass" size="sm" onClick={handleGenerateReport}>
              📊 Export Report
            </Button>
            <Button variant="glass" size="sm" onClick={handlePrintDashboard}>
              🖨️ Print Dashboard
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats.users?.total || 0}
            icon="👥"
            trend={
              stats.users?.growth > 0
                ? "up"
                : stats.users?.growth < 0
                ? "down"
                : null
            }
            trendValue={
              stats.users?.growth !== 0
                ? `${Math.abs(stats.users?.growth || 0)}% from last month`
                : "No change"
            }
          />
          <StatCard
            title="Active Hosts"
            value={stats.users?.hosts || 0}
            icon="🏠"
            trend="up"
            trendValue={`${(
              ((stats.users?.hosts || 0) / (stats.users?.total || 1)) *
              100
            ).toFixed(1)}% of users`}
          />
          <StatCard
            title="Total Orders"
            value={stats.orders?.total || 0}
            icon="📦"
            trend={
              stats.orders?.growth > 0
                ? "up"
                : stats.orders?.growth < 0
                ? "down"
                : null
            }
            trendValue={
              stats.orders?.growth !== 0
                ? `${Math.abs(stats.orders?.growth || 0)}% from last month`
                : "No change"
            }
          />
          <StatCard
            title="Platform Revenue"
            value={`₹${(stats.revenue?.total || 0).toLocaleString()}`}
            icon="💰"
            trend={
              stats.revenue?.growth > 0
                ? "up"
                : stats.revenue?.growth < 0
                ? "down"
                : null
            }
            trendValue={
              stats.revenue?.growth !== 0
                ? `${Math.abs(stats.revenue?.growth || 0)}% from last month`
                : "No change"
            }
          />
          <StatCard
            title="Active Listings"
            value={stats.listings?.active || 0}
            icon="📋"
            trend="up"
            trendValue={`${stats.listings?.total || 0} total listings`}
          />
          <StatCard
            title="Completed Orders"
            value={stats.orders?.completed || 0}
            icon="✅"
            trend="up"
            trendValue={`${(
              ((stats.orders?.completed || 0) / (stats.orders?.total || 1)) *
              100
            ).toFixed(1)}% completion rate`}
          />
          <StatCard
            title="Disputed Orders"
            value={stats.orders?.disputed || 0}
            icon="⚠️"
            trend={stats.orders?.disputed > 0 ? "down" : null}
            trendValue={
              stats.orders?.disputed > 0 ? "Needs attention" : "All good"
            }
          />
          <StatCard
            title="Pending Payouts"
            value={`₹${(stats.payouts?.pending || 0).toLocaleString()}`}
            icon="⏳"
            trend="up"
            trendValue={`₹${(
              stats.payouts?.processed || 0
            ).toLocaleString()} processed`}
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
            <div className="space-y-3">
              {recentOrders?.slice(0, 5).map((order, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-2 border-b last:border-b-0"
                >
                  <div>
                    <p className="font-medium">Order #{order._id?.slice(-6)}</p>
                    <p className="text-sm text-gray-600">
                      {order.renterId?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.lines?.[0]?.listingId?.title || "Listing"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ₹{order.totalAmount?.toLocaleString()}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        order.orderStatus === "completed"
                          ? "bg-green-100 text-green-800"
                          : order.orderStatus === "confirmed"
                          ? "bg-blue-100 text-blue-800"
                          : order.orderStatus === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : order.orderStatus === "disputed"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {order.orderStatus}
                    </span>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {(!recentOrders || recentOrders.length === 0) && (
                <p className="text-gray-500 text-center py-4">
                  No recent orders
                </p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Top Performing Listings
            </h3>
            <div className="space-y-3">
              {topListings?.slice(0, 5).map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-2 border-b last:border-b-0"
                >
                  <div>
                    <p className="font-medium">{item.listing?.title}</p>
                    <p className="text-sm text-gray-600">
                      {item.listing?.category}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.totalBookings} bookings
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ₹{item.listing?.basePrice}/day
                    </p>
                    <p className="text-xs text-gray-500">
                      ₹{item.totalRevenue?.toFixed(0)} revenue
                    </p>
                  </div>
                </div>
              ))}
              {(!topListings || topListings.length === 0) && (
                <p className="text-gray-500 text-center py-4">
                  No listings data
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const renderUsers = () => {
    if (usersLoading) {
      return <div className="text-center py-8">Loading users...</div>;
    }

    const users = usersData?.data?.data?.users || [];

    return (
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">User Management</h3>
          
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">User</th>
                <th className="text-left py-3 px-4">Role</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Joined</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : user.isHost
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.role === "admin"
                        ? "Admin"
                        : user.isHost
                        ? "Host"
                        : "Customer"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        user.isVerified
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {user.isVerified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <Button
                        variant="glass"
                        size="sm"
                        onClick={() => handleViewUser(user)}
                      >
                        👁️ View
                      </Button>
                      <Button
                        variant="warning"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        ✏️ Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  };

  const renderOrders = () => {
    if (ordersLoading) {
      return <div className="text-center py-8">Loading orders...</div>;
    }

    const orders = ordersData?.data?.data?.orders || [];

    return (
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Order Management</h3>
          <div className="flex space-x-2">
            <Button variant="glass" size="sm">
              🔍 Filter
            </Button>
            <Button variant="glass" size="sm" onClick={exportOrderData}>
              📥 Export
            </Button>
            <Button variant="glass" size="sm" onClick={handlePrintOrders}>
              🖨️ Print
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Order ID</th>
                <th className="text-left py-3 px-4">Customer</th>
                <th className="text-left py-3 px-4">Host</th>
                <th className="text-left py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-sm">
                    #{order._id?.slice(-8)}
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">
                        {order.renterId?.name || "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.renterId?.email || "N/A"}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium">
                      {order.hostId?.name ||
                        order.hostId?.hostProfile?.displayName ||
                        "N/A"}
                    </p>
                  </td>
                  <td className="py-3 px-4 font-medium">
                    ₹{order.totalAmount?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        order.orderStatus === "completed"
                          ? "bg-green-100 text-green-800"
                          : order.orderStatus === "confirmed"
                          ? "bg-blue-100 text-blue-800"
                          : order.orderStatus === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : order.orderStatus === "disputed"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <Button
                        variant="glass"
                        size="sm"
                        onClick={() => handleViewOrder(order)}
                      >
                        👁️ View
                      </Button>
                      <Button variant="warning" size="sm">
                        🔄 Update
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  };

  const renderPayouts = () => {
    if (payoutsLoading) {
      return <div className="text-center py-8">Loading payouts...</div>;
    }

    const payouts = payoutsData?.data?.data?.payouts || [];

    return (
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Payout Management</h3>
          <div className="flex space-x-2">
            <Button variant="success" size="sm">
              💳 Process All
            </Button>
            <Button variant="primary" size="sm">
              📊 Generate Report
            </Button>
            <Button variant="glass" size="sm" onClick={handlePrintPayouts}>
              🖨️ Print Payouts
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Host</th>
                <th className="text-left py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Orders</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Due Date</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{payout.hostName}</p>
                      <p className="text-sm text-gray-600">
                        {payout.hostEmail}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium">
                    ₹{payout.amount?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">{payout.orderCount} orders</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        payout.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : payout.status === "processing"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {payout.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(payout.dueDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManagePayout(payout)}
                      >
                        Manage
                      </Button>
                      {payout.status === "pending" && (
                        <Button size="sm">Process</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  };

  const renderReports = () => {
    if (analyticsLoading) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-64 rounded-lg"></div>
            </div>
          ))}
        </div>
      );
    }

    const analytics = analyticsData?.data?.data || {};
    const categories = analytics.categoryPerformance || [];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Over Time</h3>
          <div className="space-y-3">
            {analytics.revenueOverTime?.slice(-7).map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2 border-b"
              >
                <span className="text-sm">
                  {new Date(
                    item._id.year,
                    item._id.month - 1,
                    item._id.day
                  ).toLocaleDateString()}
                </span>
                <div className="text-right">
                  <p className="font-medium">
                    ₹{item.revenue?.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{item.orders} orders</p>
                </div>
              </div>
            ))}
            {(!analytics.revenueOverTime ||
              analytics.revenueOverTime.length === 0) && (
              <p className="text-gray-500 text-center py-8">
                No revenue data available
              </p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">User Growth</h3>
          <div className="space-y-3">
            {analytics.userGrowth?.slice(-7).map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2 border-b"
              >
                <span className="text-sm">
                  {new Date(
                    item._id.year,
                    item._id.month - 1,
                    item._id.day
                  ).toLocaleDateString()}
                </span>
                <div className="text-right">
                  <p className="font-medium">{item.newUsers} new users</p>
                  <p className="text-xs text-gray-500">{item.newHosts} hosts</p>
                </div>
              </div>
            ))}
            {(!analytics.userGrowth || analytics.userGrowth.length === 0) && (
              <p className="text-gray-500 text-center py-8">
                No user growth data available
              </p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Popular Categories</h3>
          <div className="space-y-3">
            {categories.slice(0, 10).map((category, index) => {
              const totalBookings = categories.reduce(
                (sum, cat) => sum + cat.bookings,
                0
              );
              const percentage =
                totalBookings > 0
                  ? ((category.bookings / totalBookings) * 100).toFixed(1)
                  : 0;
              return (
                <div
                  key={index}
                  className="flex justify-between items-center py-2"
                >
                  <div>
                    <span className="font-medium">
                      {category._id || "Unknown"}
                    </span>
                    <p className="text-xs text-gray-500">
                      {category.bookings} bookings
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{percentage}%</span>
                    <p className="text-xs text-gray-500">
                      ₹{category.revenue?.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
            {categories.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No category data available
              </p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Export & Print Reports</h3>
          <div className="space-y-3">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={exportUserData}
              >
                📥 Export User Data
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handlePrintUsers}
              >
                🖨️ Print Users
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={exportOrderData}
              >
                📥 Export Orders
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handlePrintOrders}
              >
                🖨️ Print Orders
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={exportRevenueReport}
              >
                📥 Export Revenue Report
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handlePrintDashboard}
              >
                🖨️ Print Dashboard
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={exportPayoutReport}
              >
                📥 Export Payout Report
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handlePrintPayouts}
              >
                🖨️ Print Payouts
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const renderContent = () => {
    switch (selectedTab) {
      case "overview":
        return renderOverview();
      case "users":
        return renderUsers();
      case "orders":
        return renderOrders();
      case "payouts":
        return renderPayouts();
      case "reports":
        return renderReports();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="glass" onClick={refreshData}>
            🔄 Refresh
          </Button>
          <Button variant="primary" onClick={handleGenerateReport}>
            📊 Generate Report
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {renderContent()}

      {/* Modals */}
      <UserManagementModal
        user={selectedUser}
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setSelectedUser(null);
        }}
        onUpdate={() => {
          // Refresh users data
        }}
      />

      <UserDetailsModal
        user={selectedUser}
        isOpen={showUserDetailsModal}
        onClose={() => {
          setShowUserDetailsModal(false);
          setSelectedUser(null);
        }}
      />

      <OrderDetailsModal
        order={selectedOrder}
        isOpen={showOrderModal}
        onClose={() => {
          setShowOrderModal(false);
          setSelectedOrder(null);
        }}
        onUpdate={() => {
          // Refresh orders data
        }}
      />

      <PayoutManagementModal
        payout={selectedPayout}
        isOpen={showPayoutModal}
        onClose={() => {
          setShowPayoutModal(false);
          setSelectedPayout(null);
        }}
        onUpdate={() => {
          // Refresh payouts data
        }}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => {
          setShowExportModal(false);
          setExportType("");
          setExportData(null);
        }}
        onExport={handleExportData}
        title={`Export ${
          exportType.charAt(0).toUpperCase() + exportType.slice(1)
        } Data`}
        description={`Choose your preferred format to export ${exportType} data`}
        dataPreview={{
          count: Array.isArray(exportData) ? exportData.length : 1,
          sample:
            exportType === "users"
              ? "Users with name, email, role..."
              : exportType === "orders"
              ? "Orders with customer, amount, status..."
              : exportType === "payouts"
              ? "Payouts with host, amount, status..."
              : exportType === "report"
              ? "Comprehensive admin report with all statistics"
              : "Data export",
        }}
      />
    </div>
  );
};

export default AdminDashboard;
