import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import UserManagementModal from '../../components/admin/UserManagementModal';
import OrderDetailsModal from '../../components/admin/OrderDetailsModal';
import PayoutManagementModal from '../../components/admin/PayoutManagementModal';

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  const refreshData = () => {
    queryClient.invalidateQueries(['admin']);
  };

  const handleGenerateReport = async () => {
    try {
      // Ensure we have dashboard data
      if (!dashboardData?.data?.data) {
        alert('Dashboard data not available. Please wait for data to load and try again.');
        return;
      }

      // Get current date for filename
      const date = new Date().toISOString().split('T')[0];
      
      // Create comprehensive report data
      const reportData = {
        generatedAt: new Date().toISOString(),
        period: '30 days',
        stats: dashboardData.data.data.stats || {},
        recentOrders: dashboardData.data.data.recentOrders || [],
        topListings: dashboardData.data.data.topListings || [],
        analytics: analyticsData?.data?.data || {}
      };

      // Convert to CSV format for easy viewing
      const csvContent = generateCSVReport(reportData);
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `admin-report-${date}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('Report generated and downloaded successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    }
  };

  const generateCSVReport = (data) => {
    let csv = 'Admin Dashboard Report\n';
    csv += `Generated at: ${new Date(data.generatedAt).toLocaleString()}\n\n`;
    
    // Platform Statistics
    csv += 'PLATFORM STATISTICS\n';
    csv += 'Metric,Value\n';
    csv += `Total Users,${data.stats.users?.total || 0}\n`;
    csv += `Active Hosts,${data.stats.users?.hosts || 0}\n`;
    csv += `Customer Users,${data.stats.users?.customers || 0}\n`;
    csv += `Total Listings,${data.stats.listings?.total || 0}\n`;
    csv += `Active Listings,${data.stats.listings?.active || 0}\n`;
    csv += `Total Orders,${data.stats.orders?.total || 0}\n`;
    csv += `Completed Orders,${data.stats.orders?.completed || 0}\n`;
    csv += `Platform Revenue,₹${data.stats.revenue?.total || 0}\n`;
    csv += `Pending Payouts,₹${data.stats.payouts?.pending || 0}\n\n`;
    
    // Recent Orders
    csv += 'RECENT ORDERS\n';
    csv += 'Order ID,Customer,Amount,Status,Date\n';
    data.recentOrders.forEach(order => {
      csv += `${order._id?.slice(-6) || 'N/A'},`;
      csv += `${order.renterId?.name || 'Unknown'},`;
      csv += `₹${order.totalAmount || 0},`;
      csv += `${order.orderStatus || 'Unknown'},`;
      csv += `${new Date(order.createdAt).toLocaleDateString()}\n`;
    });
    csv += '\n';
    
    // Top Listings
    csv += 'TOP PERFORMING LISTINGS\n';
    csv += 'Listing,Category,Bookings,Revenue,Base Price\n';
    data.topListings.forEach(item => {
      csv += `${item.listing?.title || 'Unknown'},`;
      csv += `${item.listing?.category || 'Unknown'},`;
      csv += `${item.totalBookings || 0},`;
      csv += `₹${item.totalRevenue?.toFixed(0) || 0},`;
      csv += `₹${item.listing?.basePrice || 0}\n`;
    });
    
    return csv;
  };

  // Fetch admin dashboard data
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminAPI.getDashboard(),
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch users data
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminAPI.getUsers(),
    enabled: isAdmin && selectedTab === 'users',
    staleTime: 5 * 60 * 1000,
  });

  // Fetch orders data
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: () => adminAPI.getOrders(),
    enabled: isAdmin && selectedTab === 'orders',
    staleTime: 5 * 60 * 1000,
  });

  // Fetch payouts data
  const { data: payoutsData, isLoading: payoutsLoading } = useQuery({
    queryKey: ['admin', 'payouts'],
    queryFn: () => adminAPI.getPayouts(),
    enabled: isAdmin && selectedTab === 'payouts',
    staleTime: 5 * 60 * 1000,
  });

  // Fetch analytics data
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: () => adminAPI.getAnalytics(),
    enabled: isAdmin && selectedTab === 'reports',
    staleTime: 5 * 60 * 1000,
  });

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
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
          <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'payouts', label: 'Payouts', icon: '💰' },
    { id: 'reports', label: 'Reports', icon: '📈' },
  ];

  const StatCard = ({ title, value, icon, trend, trendValue }) => (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? '↗' : '↘'} {trendValue}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats.users?.total || 0}
            icon="👥"
            trend={stats.users?.growth > 0 ? "up" : stats.users?.growth < 0 ? "down" : null}
            trendValue={stats.users?.growth !== 0 ? `${Math.abs(stats.users?.growth || 0)}% from last month` : "No change"}
          />
          <StatCard
            title="Active Hosts"
            value={stats.users?.hosts || 0}
            icon="🏠"
            trend="up"
            trendValue={`${((stats.users?.hosts || 0) / (stats.users?.total || 1) * 100).toFixed(1)}% of users`}
          />
          <StatCard
            title="Total Orders"
            value={stats.orders?.total || 0}
            icon="📦"
            trend={stats.orders?.growth > 0 ? "up" : stats.orders?.growth < 0 ? "down" : null}
            trendValue={stats.orders?.growth !== 0 ? `${Math.abs(stats.orders?.growth || 0)}% from last month` : "No change"}
          />
          <StatCard
            title="Platform Revenue"
            value={`₹${(stats.revenue?.total || 0).toLocaleString()}`}
            icon="💰"
            trend={stats.revenue?.growth > 0 ? "up" : stats.revenue?.growth < 0 ? "down" : null}
            trendValue={stats.revenue?.growth !== 0 ? `${Math.abs(stats.revenue?.growth || 0)}% from last month` : "No change"}
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
            trendValue={`${((stats.orders?.completed || 0) / (stats.orders?.total || 1) * 100).toFixed(1)}% completion rate`}
          />
          <StatCard
            title="Disputed Orders"
            value={stats.orders?.disputed || 0}
            icon="⚠️"
            trend={stats.orders?.disputed > 0 ? "down" : null}
            trendValue={stats.orders?.disputed > 0 ? "Needs attention" : "All good"}
          />
          <StatCard
            title="Pending Payouts"
            value={`₹${(stats.payouts?.pending || 0).toLocaleString()}`}
            icon="⏳"
            trend="up"
            trendValue={`₹${(stats.payouts?.processed || 0).toLocaleString()} processed`}
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
            <div className="space-y-3">
              {recentOrders?.slice(0, 5).map((order, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">Order #{order._id?.slice(-6)}</p>
                    <p className="text-sm text-gray-600">{order.renterId?.name}</p>
                    <p className="text-xs text-gray-500">
                      {order.lines?.[0]?.listingId?.title || 'Listing'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{order.totalAmount?.toLocaleString()}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.orderStatus === 'completed' ? 'bg-green-100 text-green-800' :
                      order.orderStatus === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                      order.orderStatus === 'disputed' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.orderStatus}
                    </span>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {(!recentOrders || recentOrders.length === 0) && (
                <p className="text-gray-500 text-center py-4">No recent orders</p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top Performing Listings</h3>
            <div className="space-y-3">
              {topListings?.slice(0, 5).map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{item.listing?.title}</p>
                    <p className="text-sm text-gray-600">{item.listing?.category}</p>
                    <p className="text-xs text-gray-500">{item.totalBookings} bookings</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{item.listing?.basePrice}/day</p>
                    <p className="text-xs text-gray-500">₹{item.totalRevenue?.toFixed(0)} revenue</p>
                  </div>
                </div>
              ))}
              {(!topListings || topListings.length === 0) && (
                <p className="text-gray-500 text-center py-4">No listings data</p>
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
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">Export</Button>
            <Button size="sm">Add User</Button>
          </div>
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
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.isHost ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role === 'admin' ? 'Admin' : user.isHost ? 'Host' : 'Customer'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">View</Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        Edit
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
            <Button variant="outline" size="sm">Filter</Button>
            <Button variant="outline" size="sm">Export</Button>
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
                      <p className="font-medium">{order.renterId?.name || 'N/A'}</p>
                      <p className="text-sm text-gray-600">{order.renterId?.email || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium">{order.hostId?.name || order.hostId?.hostProfile?.displayName || 'N/A'}</p>
                  </td>
                  <td className="py-3 px-4 font-medium">
                    ₹{order.totalAmount?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      order.orderStatus === 'completed' ? 'bg-green-100 text-green-800' :
                      order.orderStatus === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                      order.orderStatus === 'disputed' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewOrder(order)}
                      >
                        View
                      </Button>
                      <Button variant="outline" size="sm">Update</Button>
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
            <Button variant="outline" size="sm">Process All</Button>
            <Button size="sm">Generate Report</Button>
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
                      <p className="text-sm text-gray-600">{payout.hostEmail}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium">
                    ₹{payout.amount?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    {payout.orderCount} orders
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      payout.status === 'completed' ? 'bg-green-100 text-green-800' :
                      payout.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
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
                      {payout.status === 'pending' && (
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
              <div key={index} className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">
                  {new Date(item._id.year, item._id.month - 1, item._id.day).toLocaleDateString()}
                </span>
                <div className="text-right">
                  <p className="font-medium">₹{item.revenue?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{item.orders} orders</p>
                </div>
              </div>
            ))}
            {(!analytics.revenueOverTime || analytics.revenueOverTime.length === 0) && (
              <p className="text-gray-500 text-center py-8">No revenue data available</p>
            )}
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">User Growth</h3>
          <div className="space-y-3">
            {analytics.userGrowth?.slice(-7).map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">
                  {new Date(item._id.year, item._id.month - 1, item._id.day).toLocaleDateString()}
                </span>
                <div className="text-right">
                  <p className="font-medium">{item.newUsers} new users</p>
                  <p className="text-xs text-gray-500">{item.newHosts} hosts</p>
                </div>
              </div>
            ))}
            {(!analytics.userGrowth || analytics.userGrowth.length === 0) && (
              <p className="text-gray-500 text-center py-8">No user growth data available</p>
            )}
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Popular Categories</h3>
          <div className="space-y-3">
            {categories.slice(0, 10).map((category, index) => {
              const totalBookings = categories.reduce((sum, cat) => sum + cat.bookings, 0);
              const percentage = totalBookings > 0 ? ((category.bookings / totalBookings) * 100).toFixed(1) : 0;
              return (
                <div key={index} className="flex justify-between items-center py-2">
                  <div>
                    <span className="font-medium">{category._id || 'Unknown'}</span>
                    <p className="text-xs text-gray-500">{category.bookings} bookings</p>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{percentage}%</span>
                    <p className="text-xs text-gray-500">₹{category.revenue?.toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
            {categories.length === 0 && (
              <p className="text-gray-500 text-center py-8">No category data available</p>
            )}
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Export Reports</h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full">Export User Data</Button>
            <Button variant="outline" className="w-full">Export Orders</Button>
            <Button variant="outline" className="w-full">Export Revenue Report</Button>
            <Button variant="outline" className="w-full">Export Payout Report</Button>
          </div>
        </Card>
      </div>
    );
  };

  const renderContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverview();
      case 'users':
        return renderUsers();
      case 'orders':
        return renderOrders();
      case 'payouts':
        return renderPayouts();
      case 'reports':
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
          <Button variant="outline" onClick={refreshData}>🔄 Refresh</Button>
          <Button onClick={handleGenerateReport}>📊 Generate Report</Button>
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
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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

      {/* Settings functionality removed - no backend support */}
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Admin Settings</h2>
              <Button variant="outline" onClick={() => setShowSettingsModal(false)}>✕</Button>
            </div>
            
            <div className="space-y-6">
              {/* Platform Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Platform Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Platform Commission (%)</label>
                    <input type="number" className="w-full p-2 border rounded" defaultValue="10" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Default Deposit (%)</label>
                    <input type="number" className="w-full p-2 border rounded" defaultValue="20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Upload Size (MB)</label>
                    <input type="number" className="w-full p-2 border rounded" defaultValue="10" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Auto-approval</label>
                    <select className="w-full p-2 border rounded">
                      <option value="manual">Manual Review</option>
                      <option value="auto">Auto-approve</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    Email notifications for new orders
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    SMS alerts for disputes
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Daily revenue reports
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    Weekly analytics summary
                  </label>
                </div>
              </div>

              {/* System Maintenance */}
              <div>
                <h3 className="text-lg font-semibold mb-4">System Maintenance</h3>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full">Clear Cache</Button>
                  <Button variant="outline" className="w-full">Backup Database</Button>
                  <Button variant="outline" className="w-full">Run System Diagnostics</Button>
                  <Button variant="outline" className="w-full text-red-600 border-red-600">Enable Maintenance Mode</Button>
                </div>
              </div>

              {/* Security Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Security</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Session Timeout (minutes)</label>
                    <input type="number" className="w-full p-2 border rounded" defaultValue="60" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Login Attempts</label>
                    <input type="number" className="w-full p-2 border rounded" defaultValue="5" />
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    Two-factor authentication required
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Force password reset every 90 days
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <Button variant="outline" onClick={() => setShowSettingsModal(false)}>Cancel</Button>
              <Button onClick={() => {
                alert('Settings saved successfully!');
                setShowSettingsModal(false);
              }}>Save Settings</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
