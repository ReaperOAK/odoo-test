import { useState } from "react";
import { ordersAPI } from "../../lib/api";
import Button from "../ui/Button";
import Card from "../ui/Card";

const OrderDetailsModal = ({ order, orderDetails, isLoading, isOpen, onClose }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen || !order) return null;

  const displayOrder = orderDetails?.order || order;
  const reservations = orderDetails?.reservations || [];
  const payments = orderDetails?.payments || [];

  const formatCurrency = (amount) => `₹${amount?.toLocaleString()}`;
  const formatDate = (date) => new Date(date).toLocaleString();

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    setIsUpdating(true);
    try {
      await ordersAPI.cancel(order._id);
      onClose();
      window.location.reload(); // Refresh to show updated status
    } catch (error) {
      console.error("Failed to cancel order:", error);
      alert("Failed to cancel order. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

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
                  <span className="ml-2">{formatDate(displayOrder.createdAt)}</span>
                </div>
                <div>
                  <span className="font-medium">Total Amount:</span>
                  <span className="ml-2 font-semibold text-green-600">
                    {formatCurrency(displayOrder.totalAmount)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Payment Status:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      displayOrder.paymentStatus === "paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {displayOrder.paymentStatus}
                  </span>
                </div>
              </div>
            </Card>

            {/* Host Information */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Host Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Host Name:</span>
                  <span className="ml-2">
                    {displayOrder.hostId?.hostProfile?.displayName ||
                      displayOrder.hostId?.name ||
                      "N/A"}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Contact:</span>
                  <span className="ml-2">{displayOrder.hostId?.email || "N/A"}</span>
                </div>
                {displayOrder.hostId?.phone && (
                  <div>
                    <span className="font-medium">Phone:</span>
                    <span className="ml-2">{displayOrder.hostId.phone}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Order Items */}
            <Card className="p-4 lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Rental Items</h3>
              <div className="space-y-3">
                {displayOrder.lines?.map((line, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {line.listingId?.title || "Item"}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {line.listingId?.category || "Category"}
                        </p>
                        <div className="text-sm mt-2 space-y-1">
                          <p>
                            <span className="font-medium">Quantity:</span> {line.qty}
                          </p>
                          <p>
                            <span className="font-medium">Duration:</span>{" "}
                            {Math.ceil(
                              (new Date(line.end) - new Date(line.start)) /
                                (1000 * 60 * 60 * 24)
                            )}{" "}
                            days
                          </p>
                          <p>
                            <span className="font-medium">From:</span> {formatDate(line.start)}
                          </p>
                          <p>
                            <span className="font-medium">To:</span> {formatDate(line.end)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-medium text-lg">
                          {formatCurrency(line.lineTotal)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(line.unitPrice)}/day
                        </p>
                      </div>
                    </div>
                    {line.listingId?.images?.length > 0 && (
                      <img
                        src={line.listingId.images[0]}
                        alt={line.listingId.title}
                        className="w-full h-40 object-cover rounded-lg mt-3"
                      />
                    )}
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
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Payment #{payment._id?.slice(-8)}</p>
                          <p className="text-sm text-gray-600">Method: {payment.method}</p>
                          <p className="text-sm">Status: <span className={`px-2 py-1 rounded-full text-xs ${
                            payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>{payment.status}</span></p>
                          <p className="text-sm text-gray-600">{formatDate(payment.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Actions */}
            <Card className="p-4 lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Actions</h3>
              <div className="flex space-x-3">
                {(displayOrder.orderStatus === "quote" || displayOrder.orderStatus === "confirmed") && (
                  <Button
                    onClick={handleCancelOrder}
                    disabled={isUpdating}
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    {isUpdating ? "Cancelling..." : "Cancel Order"}
                  </Button>
                )}
                
                {displayOrder.orderStatus === "quote" && displayOrder.paymentStatus === "pending" && (
                  <Button
                    onClick={() => {
                      window.location.href = `/checkout/${displayOrder._id}`;
                    }}
                  >
                    Complete Payment
                  </Button>
                )}
                
                <Button
                  onClick={onClose}
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
