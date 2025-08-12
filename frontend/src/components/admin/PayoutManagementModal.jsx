import { useState } from "react";
import { adminAPI } from "../../lib/api";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { useData } from "../../contexts/DataContext";

const PayoutManagementModal = ({ payout, isOpen, onClose, onUpdate }) => {
  const [notes, setNotes] = useState("");
  const [processingData, setProcessingData] = useState({
    bankAccount: "",
    transactionRef: "",
    processingFee: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const { actions } = useData();

  const processPayoutAction = async (data) => {
    setIsProcessing(true);
    try {
      await adminAPI.processPayout(payout._id, data);
      try {
        await actions.fetchAdminPayouts();
      } catch (refreshError) {
        console.warn("Failed to refresh payouts:", refreshError);
      }
      onUpdate?.();
      onClose();
    } catch (error) {
      console.error("Failed to process payout:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessPayout = () => {
    processPayoutAction({
      ...processingData,
      adminNotes: notes,
      status: "processing",
    });
  };

  const handleCompletePayout = () => {
    processPayoutAction({
      ...processingData,
      adminNotes: notes,
      status: "completed",
    });
  };

  const handleRejectPayout = () => {
    processPayoutAction({
      adminNotes: notes,
      status: "rejected",
    });
  };

  if (!isOpen || !payout) return null;

  const formatCurrency = (amount) => `₹${amount?.toLocaleString()}`;
  const formatDate = (date) => new Date(date).toLocaleString();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Payout Management</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payout Information */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Payout Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Payout ID:</span>
                  <span className="ml-2 font-mono">
                    #{payout._id?.slice(-8)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      payout.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : payout.status === "processing"
                        ? "bg-blue-100 text-blue-800"
                        : payout.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {payout.status}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Amount:</span>
                  <span className="ml-2 font-semibold text-lg">
                    {formatCurrency(payout.amount)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Processing Fee:</span>
                  <span className="ml-2">
                    {formatCurrency(payout.processingFee || 0)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Net Amount:</span>
                  <span className="ml-2 font-semibold">
                    {formatCurrency(
                      (payout.amount || 0) - (payout.processingFee || 0)
                    )}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Due Date:</span>
                  <span className="ml-2">{formatDate(payout.dueDate)}</span>
                </div>
                <div>
                  <span className="font-medium">Created:</span>
                  <span className="ml-2">{formatDate(payout.createdAt)}</span>
                </div>
                {payout.processedAt && (
                  <div>
                    <span className="font-medium">Processed:</span>
                    <span className="ml-2">
                      {formatDate(payout.processedAt)}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Host Information */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Host Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Name:</span>
                  <span className="ml-2">{payout.hostName}</span>
                </div>
                <div>
                  <span className="font-medium">Email:</span>
                  <span className="ml-2">{payout.hostEmail}</span>
                </div>
                {payout.hostPhone && (
                  <div>
                    <span className="font-medium">Phone:</span>
                    <span className="ml-2">{payout.hostPhone}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium">Total Orders:</span>
                  <span className="ml-2">{payout.orderCount}</span>
                </div>
                <div>
                  <span className="font-medium">Period:</span>
                  <span className="ml-2">
                    {formatDate(payout.periodStart)} -{" "}
                    {formatDate(payout.periodEnd)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Orders Included */}
            {payout.orders && payout.orders.length > 0 && (
              <Card className="p-4 lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">
                  Orders Included in Payout
                </h3>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Order ID</th>
                        <th className="text-left py-2">Customer</th>
                        <th className="text-left py-2">Date</th>
                        <th className="text-left py-2">Amount</th>
                        <th className="text-left py-2">Host Earning</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payout.orders.map((order, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 font-mono">
                            #{order._id?.slice(-6)}
                          </td>
                          <td className="py-2">{order.customerName}</td>
                          <td className="py-2">
                            {formatDate(order.completedAt)}
                          </td>
                          <td className="py-2">
                            {formatCurrency(order.totalAmount)}
                          </td>
                          <td className="py-2 font-medium">
                            {formatCurrency(order.hostEarnings)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Processing Actions */}
            {payout.status === "pending" && (
              <Card className="p-4 lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Process Payout</h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bank Account/UPI ID
                      </label>
                      <input
                        type="text"
                        value={processingData.bankAccount}
                        onChange={(e) =>
                          setProcessingData((prev) => ({
                            ...prev,
                            bankAccount: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter bank account or UPI ID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transaction Reference
                      </label>
                      <input
                        type="text"
                        value={processingData.transactionRef}
                        onChange={(e) =>
                          setProcessingData((prev) => ({
                            ...prev,
                            transactionRef: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Transaction reference number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Processing Fee (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={processingData.processingFee}
                      onChange={(e) =>
                        setProcessingData((prev) => ({
                          ...prev,
                          processingFee: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add any processing notes..."
                    />
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      onClick={handleProcessPayout}
                      disabled={isProcessing}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {isProcessing ? "Processing..." : "Mark as Processing"}
                    </Button>
                    <Button
                      onClick={handleCompletePayout}
                      disabled={isProcessing || !processingData.transactionRef}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {isProcessing ? "Processing..." : "Complete Payout"}
                    </Button>
                    <Button
                      onClick={handleRejectPayout}
                      disabled={isProcessing}
                      variant="outline"
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      {isProcessing ? "Processing..." : "Reject"}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Previous Notes */}
            {payout.adminNotes && (
              <Card className="p-4 lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Admin Notes</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm">{payout.adminNotes}</p>
                </div>
              </Card>
            )}

            {/* Transaction Details */}
            {payout.transactionRef && (
              <Card className="p-4 lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">
                  Transaction Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Transaction Ref:</span>
                    <span className="ml-2 font-mono">
                      {payout.transactionRef}
                    </span>
                  </div>
                  {payout.bankAccount && (
                    <div>
                      <span className="font-medium">Account:</span>
                      <span className="ml-2">{payout.bankAccount}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}
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

export default PayoutManagementModal;
