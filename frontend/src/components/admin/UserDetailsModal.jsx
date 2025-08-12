import React from "react";
import Button from "../ui/Button";
import Card from "../ui/Card";

const UserDetailsModal = ({ user, isOpen, onClose }) => {
  if (!isOpen || !user) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">User Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <p className="text-gray-900 mt-1">{user.name || "N/A"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <p className="text-gray-900 mt-1">{user.email || "N/A"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Phone:</span>
                  <p className="text-gray-900 mt-1">{user.phone || "N/A"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Address:</span>
                  <p className="text-gray-900 mt-1">{user.address || "N/A"}</p>
                </div>
                {user.bio && (
                  <div>
                    <span className="font-medium text-gray-700">Bio:</span>
                    <p className="text-gray-900 mt-1">{user.bio}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Account Status */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Account Status</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Role:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs ${
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
                </div>
                <div>
                  <span className="font-medium text-gray-700">Verification Status:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      user.isVerified
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {user.isVerified ? "Verified" : "Pending"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Account Status:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      user.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Is Host:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      user.isHost
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {user.isHost ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </Card>

            {/* Account Details */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Account Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">User ID:</span>
                  <p className="text-gray-900 mt-1 font-mono text-sm">
                    {user._id || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Member Since:</span>
                  <p className="text-gray-900 mt-1">
                    {user.createdAt ? formatDate(user.createdAt) : "N/A"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Last Login:</span>
                  <p className="text-gray-900 mt-1">
                    {user.lastLogin ? formatDate(user.lastLogin) : "Never"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Wallet Balance:</span>
                  <p className="text-gray-900 mt-1 font-semibold">
                    ₹{(user.walletBalance || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            {/* Host Information (if applicable) */}
            {user.isHost && user.hostProfile && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Host Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-700">Display Name:</span>
                    <p className="text-gray-900 mt-1">
                      {user.hostProfile.displayName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Business Name:</span>
                    <p className="text-gray-900 mt-1">
                      {user.hostProfile.businessName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Host Since:</span>
                    <p className="text-gray-900 mt-1">
                      {user.hostProfile.createdAt 
                        ? formatDate(user.hostProfile.createdAt) 
                        : "N/A"}
                    </p>
                  </div>
                  {user.hostProfile.verified !== undefined && (
                    <div>
                      <span className="font-medium text-gray-700">Host Verified:</span>
                      <span
                        className={`ml-2 px-2 py-1 rounded-full text-xs ${
                          user.hostProfile.verified
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {user.hostProfile.verified ? "Verified" : "Pending"}
                      </span>
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

export default UserDetailsModal;
