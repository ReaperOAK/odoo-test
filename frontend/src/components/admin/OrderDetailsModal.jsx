import { useState, useEffect } from "react";
import { adminAPI } from "../../lib/api";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { useData } from "../../contexts/DataContext";

const OrderDetailsModal = ({ order, isOpen, onClose, onUpdate }) => {
  const [notes, setNotes] = useState("");
  const [newStatus, setNewStatus] = useState(order?.orderStatus || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  const { actions } = useData();

  const updateOrderStatus = async (data) => {
    setIsUpdating(true);
    try {
      await adminAPI.updateOrderStatus(order._id, data);
      dispatch({ type: "FETCH_ORDERS_START" });
      onUpdate?.();
    } catch (error) {
      console.error("Failed to update order:", error);
      alert("Failed to update order status. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const resolveDispute = async (data) => {
    setIsResolving(true);
    try {
      await adminAPI.resolveDispute(order._id, data);
      try {
        await actions.fetchAdminOrders();
      } catch (refreshError) {
        console.warn("Failed to refresh orders:", refreshError);
      }
      onUpdate?.();
      onClose();
    } catch (error) {
      console.error("Failed to resolve dispute:", error);
    } finally {
      setIsResolving(false);
    }
  };

  const handleStatusUpdate = () => {
    updateOrderStatus({
      status: newStatus,
      adminNotes: notes,
    });
  };

  const handleResolveDispute = (resolution) => {
    resolveDispute({
      resolution,
      adminNotes: notes,
    });
  };

  if (!isOpen || !order) return null;

  const displayOrder = orderDetails?.order || order;
  const reservations = orderDetails?.reservations || [];
  const payments = orderDetails?.payments || [];
  const lateFees = orderDetails?.lateFees || [];

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  const statusOptions = [
    "quote",
    "confirmed",
    "in_progress",
    "completed",
    "cancelled",
    "disputed",
  ];

  const formatCurrency = (amount) => `₹${amount?.toLocaleString()}`;
  const formatDate = (date) => new Date(date).toLocaleString();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Order Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Information */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Order Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Order ID:</span>
                  <span className="ml-2 font-mono">
                    #{displayOrder._id?.slice(-8)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      displayOrder.orderStatus === "completed"
                        ? "bg-green-100 text-green-800"
                        : displayOrder.orderStatus === "confirmed"
                        ? "bg-blue-100 text-blue-800"
                        : displayOrder.orderStatus === "cancelled"
                        ? "bg-red-100 text-red-800"
                        : displayOrder.orderStatus === "disputed"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {displayOrder.orderStatus}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Created:</span>
                  <span className="ml-2">
                    {formatDate(displayOrder.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Total Amount:</span>
                  <span className="ml-2 font-semibold">
                    {formatCurrency(displayOrder.totalAmount)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Platform Commission:</span>
                  <span className="ml-2">
                    {formatCurrency(
                      displayOrder.platformFee || displayOrder.totalAmount * 0.1
                    )}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Host Earnings:</span>
                  <span className="ml-2">
                    {formatCurrency(
                      displayOrder.hostEarnings ||
                        displayOrder.totalAmount * 0.9
                    )}
                  </span>
                </div>
              </div>
            </Card>

            {/* Customer & Host Information */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Parties Involved</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700">Customer</h4>
                  <p className="font-medium">
                    {displayOrder.renterId?.name || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {displayOrder.renterId?.email || "N/A"}
                  </p>
                  {displayOrder.renterId?.phone && (
                    <p className="text-sm text-gray-600">
                      {displayOrder.renterId.phone}
                    </p>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">Host</h4>
                  <p className="font-medium">
                    {displayOrder.hostId?.name ||
                      displayOrder.hostId?.hostProfile?.displayName ||
                      "N/A"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {displayOrder.hostId?.email || "N/A"}
                  </p>
                  {displayOrder.hostId?.phone && (
                    <p className="text-sm text-gray-600">
                      {displayOrder.hostId.phone}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Order Items */}
            <Card className="p-4 lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Order Items</h3>
              <div className="space-y-3">
                {displayOrder.lines?.map((line, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">
                          {line.listingId?.title || "Item"}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {line.listingId?.category || "Category"}
                        </p>
                        <p className="text-sm">
                          Quantity: {line.qty} | Duration:{" "}
                          {Math.ceil(
                            (new Date(line.end) - new Date(line.start)) /
                              (1000 * 60 * 60 * 24)
                          )}{" "}
                          days
                        </p>
                        <p className="text-sm">
                          From: {formatDate(line.start)} | To:{" "}
                          {formatDate(line.end)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(line.lineTotal)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(line.unitPrice)}/day
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!displayOrder.lines || displayOrder.lines.length === 0) && (
                  <p className="text-gray-500 text-center py-4">
                    No items in this order
                  </p>
                )}
              </div>
            </Card>

            {/* Payments */}
            {payments.length > 0 && (
              <Card className="p-4 lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Payment History</h3>
                <div className="space-y-3">
                  {payments.map((payment, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            Payment #{payment._id?.slice(-8)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Method: {payment.method}
                          </p>
                          <p className="text-sm">
                            Status:{" "}
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                payment.status === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : payment.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {payment.status}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(payment.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(payment.amount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Reservations */}
            {reservations.length > 0 && (
              <Card className="p-4 lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Reservations</h3>
                <div className="space-y-3">
                  {reservations.map((reservation, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {reservation.listingId?.title || "Unknown Item"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(reservation.start)} -{" "}
                            {formatDate(reservation.end)}
                          </p>
                          <p className="text-sm">
                            Status:{" "}
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                reservation.status === "confirmed"
                                  ? "bg-blue-100 text-blue-800"
                                  : reservation.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : reservation.status === "returned"
                                  ? "bg-gray-100 text-gray-800"
                                  : reservation.status === "cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {reservation.status}
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Qty: {reservation.qty}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Late Fees */}
            {lateFees.length > 0 && (
              <Card className="p-4 lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Late Fees</h3>
                <div className="space-y-3">
                  {lateFees.map((lateFee, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            Late Fee #{lateFee._id?.slice(-8)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Type: {lateFee.type}
                          </p>
                          <p className="text-sm text-gray-600">
                            Reason: {lateFee.reason}
                          </p>
                          <p className="text-sm">
                            Status:{" "}
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                lateFee.status === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : lateFee.status === "waived"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {lateFee.status}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(lateFee.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(lateFee.amount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Admin Actions */}
            <Card className="p-4 lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Admin Actions</h3>

              <div className="space-y-4">
                {/* Status Update */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Status
                  </label>
                  <div className="flex space-x-3">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status.replace("_", " ").toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <Button
                      onClick={handleStatusUpdate}
                      disabled={
                        isUpdating || newStatus === displayOrder.orderStatus
                      }
                    >
                      {isUpdating ? "Updating..." : "Update"}
                    </Button>
                  </div>
                </div>

                {/* Dispute Resolution */}
                {displayOrder.orderStatus === "disputed" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dispute Resolution
                    </label>
                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => handleResolveDispute("favor_customer")}
                        disabled={isResolving}
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        {isResolving ? "Resolving..." : "Favor Customer"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleResolveDispute("favor_host")}
                        disabled={isResolving}
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {isResolving ? "Resolving..." : "Favor Host"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleResolveDispute("split_decision")}
                        disabled={isResolving}
                        className="bg-purple-50 text-purple-700 border-purple-200"
                      >
                        {isResolving ? "Resolving..." : "Split Decision"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add any admin notes or comments..."
                  />
                </div>

                {/* Previous Admin Notes */}
                {order.adminNotes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Previous Admin Notes
                    </label>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm">{order.adminNotes}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
