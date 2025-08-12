import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { ordersAPI } from "../lib/api";
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import OrderDetailsModal from "../components/orders/OrderDetailsModal";
import EditOrderModal from "../components/orders/EditOrderModal";

const MyBookings = () => {
  const { user } = useAuth();
  const { state, actions } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get("status");

  // State for modals and selected data
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Fetch orders when component mounts or filter changes
  useEffect(() => {
    if (user) {
      actions.fetchOrders();
    }
  }, [user, statusFilter, actions]);

  // Filter orders based on status
  const allOrders = Array.isArray(state.orders) ? state.orders : [];
  const filteredOrders = statusFilter
    ? allOrders.filter((order) => order.orderStatus === statusFilter)
    : allOrders;

  const ordersData = filteredOrders;
  const isLoading = state.ordersLoading;
  const error = state.ordersError;

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
      quote: "bg-orange-100 text-orange-800",
      confirmed: "bg-blue-100 text-blue-800",
      in_progress: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
      disputed: "bg-purple-100 text-purple-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      case "disputed":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Handler functions for view and edit
  const handleViewOrder = async (order) => {
    setSelectedOrder(order);
    setIsLoadingDetails(true);
    setShowOrderModal(true);
    
    try {
      const response = await ordersAPI.getById(order._id);
      setOrderDetails(response.data.data);
    } catch (error) {
      console.error("Failed to fetch order details:", error);
      alert("Failed to load order details. Please try again.");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setShowEditModal(true);
  };

  const handleCloseModals = () => {
    setShowOrderModal(false);
    setShowEditModal(false);
    setSelectedOrder(null);
    setOrderDetails(null);
  };

  const handleUpdateOrder = async (orderId, updateData) => {
    try {
      await ordersAPI.updateStatus(orderId, updateData);
      // Refresh orders list
      actions.fetchOrders();
      handleCloseModals();
      alert("Order updated successfully!");
    } catch (error) {
      console.error("Failed to update order:", error);
      alert("Failed to update order. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="bg-gray-300 h-8 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-300 h-32 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Error Loading Bookings
          </h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const orders = ordersData || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Rentals</h1>

        {/* Success notification */}
        {searchParams.get("status") === "success" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">
                Rental booking successful!
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: "", label: "All Rentals" },
            { key: "quote", label: "Quote" },
            { key: "confirmed", label: "Confirmed" },
            { key: "in_progress", label: "In Progress" },
            { key: "completed", label: "Completed" },
            { key: "cancelled", label: "Cancelled" },
            { key: "disputed", label: "Disputed" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                if (key) {
                  setSearchParams({ status: key });
                } else {
                  setSearchParams({});
                }
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                statusFilter === key
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No bookings found
          </h3>
          <p className="text-gray-600 mb-6">
            You haven't made any bookings yet.
          </p>
          <Button
            variant="primary"
            onClick={() => (window.location.href = "/")}
            className="text-white font-bold"
          >
            🛍️ Start Browsing
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const orderLine = order.lines[0];
            const listing = orderLine?.listingId;

            return (
              <Card key={order._id}>
                <Card.Content className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          order.orderStatus
                        )}`}
                      >
                        {getStatusIcon(order.orderStatus)}
                        <span className="ml-1 capitalize">
                          {order.orderStatus.replace("_", " ")}
                        </span>
                      </span>
                      <span className="text-sm text-gray-500">
                        Order #
                        {order.orderNumber || order._id?.slice(-8) || "N/A"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </div>
                  </div>

                  {listing && (
                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                      <div className="flex-shrink-0">
                        <img
                          src={
                            listing.images?.length > 0
                              ? listing.images[0]
                              : "/placeholder-image.jpg"
                          }
                          alt={listing.title}
                          className="w-full sm:w-32 h-32 object-cover rounded-lg"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {listing.title}
                        </h3>

                        {listing.location && (
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            {listing.location}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Check-in:</span>
                            <div className="font-medium">
                              {formatDate(orderLine.start)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Check-out:</span>
                            <div className="font-medium">
                              {formatDate(orderLine.end)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Quantity:</span>
                            <div className="font-medium">{orderLine.qty}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Total Paid:</span>
                            <div className="font-medium">
                              {formatPrice(order.totalAmount)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0 flex flex-col sm:items-end space-y-2">
                        <div
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.paymentStatus === "paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {order.paymentStatus === "paid"
                            ? "Paid"
                            : "Payment Pending"}
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            {formatPrice(order.totalAmount)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {order.paymentStatus === "paid"
                              ? "Deposit paid"
                              : "Total amount"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Host Info */}
                  {order.hostId && (
                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Host:</span>
                        <span className="text-sm font-medium">
                          {order.hostId.hostProfile?.displayName ||
                            order.hostId.name ||
                            "Unknown Host"}
                        </span>
                        {order.hostId.hostProfile?.verified && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                            Verified
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {order.orderStatus === "quote" &&
                          order.paymentStatus === "pending" && (
                            <Button
                              onClick={() =>
                                (window.location.href = `/checkout/${order._id}`)
                              }
                              size="sm"
                            >
                              Complete Payment
                            </Button>
                          )}
                        
                        <Button
                          onClick={() => handleViewOrder(order)}
                          size="sm"
                          variant="outline"
                        >
                          👁️ View Details
                        </Button>
                        
                        {(order.orderStatus === "quote" || order.orderStatus === "confirmed") && (
                          <Button
                            onClick={() => handleEditOrder(order)}
                            size="sm"
                            variant="outline"
                          >
                            ✏️ Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </Card.Content>
              </Card>
            );
          })}
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          orderDetails={orderDetails}
          isLoading={isLoadingDetails}
          isOpen={showOrderModal}
          onClose={handleCloseModals}
        />
      )}

      {/* Edit Order Modal */}
      {showEditModal && selectedOrder && (
        <EditOrderModal
          order={selectedOrder}
          isOpen={showEditModal}
          onClose={handleCloseModals}
          onUpdate={handleUpdateOrder}
        />
      )}
    </div>
  );
};

export default MyBookings;
