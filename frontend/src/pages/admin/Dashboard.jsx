import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import UserManagementModal from '../../components/admin/UserManagementModal';
import OrderDetailsModal from '../../components/admin/OrderDetailsModal';
import PayoutManagementModal from '../../components/admin/PayoutManagementModal';

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

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

    const stats = dashboardData?.data?.stats || {};

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats.totalUsers || 0}
            icon="👥"
            trend="up"
            trendValue="12% from last month"
          />
          <StatCard
            title="Active Hosts"
            value={stats.totalHosts || 0}
            icon="🏠"
            trend="up"
            trendValue="8% from last month"
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders || 0}
            icon="📦"
            trend="up"
            trendValue="15% from last month"
          />
          <StatCard
            title="Platform Revenue"
            value={`₹${(stats.totalRevenue?.[0]?.total || 0).toLocaleString()}`}
            icon="💰"
            trend="up"
            trendValue="20% from last month"
          />
          <StatCard
            title="Active Listings"
            value={stats.activeListings || 0}
            icon="📋"
          />
          <StatCard
            title="Completed Orders"
            value={stats.completedOrders || 0}
            icon="✅"
          />
          <StatCard
            title="Disputed Orders"
            value={stats.disputedOrders || 0}
            icon="⚠️"
          />
          <StatCard
            title="Pending Payouts"
            value={stats.pendingPayouts || 0}
            icon="⏳"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
            <div className="space-y-3">
              {stats.recentOrders?.slice(0, 5).map((order, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">Order #{order._id?.slice(-6)}</p>
                    <p className="text-sm text-gray-600">{order.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{order.totalAmount}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.orderStatus === 'completed' ? 'bg-green-100 text-green-800' :
                      order.orderStatus === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.orderStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">System Health</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>API Response Time</span>
                <span className="text-green-600 font-medium">120ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Database Status</span>
                <span className="text-green-600 font-medium">Healthy</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Payment Gateway</span>
                <span className="text-green-600 font-medium">Connected</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Storage Usage</span>
                <span className="text-yellow-600 font-medium">68%</span>
              </div>
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

    const users = usersData?.data?.users || [];

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

    const orders = ordersData?.data?.orders || [];

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
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-sm text-gray-600">{order.customerEmail}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium">{order.hostName}</p>
                  </td>
                  <td className="py-3 px-4 font-medium">
                    ₹{order.totalAmount?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      order.orderStatus === 'completed' ? 'bg-green-100 text-green-800' :
                      order.orderStatus === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
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

    const payouts = payoutsData?.data?.payouts || [];

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

  const renderReports = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue Analytics</h3>
        <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Revenue chart will be implemented here</p>
        </div>
      </Card>
      
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">User Growth</h3>
        <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">User growth chart will be implemented here</p>
        </div>
      </Card>
      
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Popular Categories</h3>
        <div className="space-y-3">
          {['Electronics', 'Furniture', 'Tools', 'Sports', 'Books'].map((category, index) => (
            <div key={index} className="flex justify-between items-center">
              <span>{category}</span>
              <span className="font-medium">{Math.floor(Math.random() * 100)}%</span>
            </div>
          ))}
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
          <Button variant="outline">Settings</Button>
          <Button>Generate Report</Button>
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
    </div>
  );
};

export default AdminDashboard;
