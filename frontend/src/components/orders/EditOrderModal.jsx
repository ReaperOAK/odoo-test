import { useState } from "react";
import Button from "../ui/Button";
import Card from "../ui/Card";

const EditOrderModal = ({ order, isOpen, onClose, onUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [editData, setEditData] = useState({
    qty: order?.lines?.[0]?.qty || 1,
    startDate: order?.lines?.[0]?.start?.split("T")[0] || "",
    endDate: order?.lines?.[0]?.end?.split("T")[0] || "",
    notes: "",
  });

  if (!isOpen || !order) return null;

  const formatCurrency = (amount) => `₹${amount?.toLocaleString()}`;
  const formatDate = (date) => new Date(date).toLocaleDateString();

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await onUpdate(order._id, {
        notes: editData.notes,
        // For now, we'll just update notes.
        // Full editing would require more complex backend changes
        metadata: {
          editRequest: {
            qty: editData.qty,
            startDate: editData.startDate,
            endDate: editData.endDate,
            requestedAt: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error("Failed to update order:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const calculateDuration = () => {
    if (!editData.startDate || !editData.endDate) return 0;
    const start = new Date(editData.startDate);
    const end = new Date(editData.endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  const estimateNewPrice = () => {
    const originalLine = order.lines?.[0];
    if (!originalLine) return 0;

    const duration = calculateDuration();
    const unitPrice = originalLine.unitPrice || 0;
    return editData.qty * unitPrice * duration;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Edit Order</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Current Order Info */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3">Current Order</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Order ID:</span> #
                  {order._id?.slice(-8)}
                </p>
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  {order.orderStatus}
                </p>
                <p>
                  <span className="font-medium">Total:</span>{" "}
                  {formatCurrency(order.totalAmount)}
                </p>
                {order.lines?.[0] && (
                  <>
                    <p>
                      <span className="font-medium">Item:</span>{" "}
                      {order.lines[0].listingId?.title}
                    </p>
                    <p>
                      <span className="font-medium">Quantity:</span>{" "}
                      {order.lines[0].qty}
                    </p>
                    <p>
                      <span className="font-medium">From:</span>{" "}
                      {formatDate(order.lines[0].start)}
                    </p>
                    <p>
                      <span className="font-medium">To:</span>{" "}
                      {formatDate(order.lines[0].end)}
                    </p>
                  </>
                )}
              </div>
            </Card>

            {/* Edit Form */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Request Changes</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editData.qty}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        qty: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={editData.startDate}
                      onChange={(e) =>
                        setEditData({ ...editData, startDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={editData.endDate}
                      onChange={(e) =>
                        setEditData({ ...editData, endDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes for Host
                  </label>
                  <textarea
                    value={editData.notes}
                    onChange={(e) =>
                      setEditData({ ...editData, notes: e.target.value })
                    }
                    placeholder="Explain why you need to make these changes..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </Card>

            {/* Price Estimate */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3">
                Estimated New Price
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Duration:</span>{" "}
                  {calculateDuration()} days
                </p>
                <p>
                  <span className="font-medium">Quantity:</span> {editData.qty}
                </p>
                <p className="text-lg font-semibold text-green-600">
                  <span className="font-medium">Estimated Total:</span>{" "}
                  {formatCurrency(estimateNewPrice())}
                </p>
              </div>
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This is an estimate. The host will
                  review your request and may adjust pricing. You'll be notified
                  of any changes before confirmation.
                </p>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                onClick={handleUpdate}
                disabled={isUpdating || !editData.notes.trim()}
                className="flex-1"
              >
                {isUpdating ? "Submitting Request..." : "Submit Change Request"}
              </Button>
              <Button onClick={onClose} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditOrderModal;
