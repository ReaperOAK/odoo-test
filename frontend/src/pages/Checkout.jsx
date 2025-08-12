import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ordersAPI, paymentsAPI } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { CreditCard, Check, Clock, AlertCircle } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

const Checkout = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState("polar");
  const [isProcessing, setIsProcessing] = useState(false);

  console.log('Checkout component loaded with orderId:', orderId);

  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => {
      console.log('Fetching order with ID:', orderId);
      return ordersAPI.getById(orderId);
    },
    select: (data) => {
      console.log('Order API response:', data);
      console.log('data.data:', data.data);
      console.log('data.data.data:', data.data.data);
      console.log('data.data.data.order:', data.data.data.order);
      const order = data.data.data.order;
      console.log('Selected order:', order);
      return order;
    },
    onError: (error) => {
      console.error('Order fetch error:', error);
      console.error('Error response:', error.response?.data);
    },
  });

  console.log('Query state:', { isLoading, error, order });
  console.log('Order exists?', !!order);

  const mockPaymentMutation = useMutation({
    mutationFn: () => paymentsAPI.mockPaymentSuccess(orderId),
    onSuccess: () => {
      setIsProcessing(false);
      // Redirect to success page or my bookings
      navigate("/my-bookings?status=success");
    },
    onError: (error) => {
      setIsProcessing(false);
      alert(error.response?.data?.message || "Payment failed");
    },
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    if (paymentMethod === "mock") {
      // Simulate payment processing delay
      setTimeout(() => {
        mockPaymentMutation.mutate();
      }, 2000);
    } else if (paymentMethod === "polar") {
      try {
        // Initiate payment with Polar
        const response = await ordersAPI.initiatePayment(orderId, {
          paymentMethod: "polar"
        });
        
        if (response.data.checkoutUrl) {
          // Redirect to Polar checkout
          window.location.href = response.data.checkoutUrl;
        } else {
          throw new Error("No checkout URL received");
        }
      } catch (error) {
        setIsProcessing(false);
        alert(error.response?.data?.message || "Failed to initiate payment");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="bg-gray-300 h-8 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="bg-gray-300 h-32 rounded"></div>
              <div className="bg-gray-300 h-20 rounded"></div>
            </div>
            <div className="bg-gray-300 h-40 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Order Not Found
          </h1>
          <p className="text-gray-600">
            The order you're looking for doesn't exist or you don't have access
            to it.
          </p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (order.paymentStatus === "paid") {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            Your booking has been confirmed. Order #{order.orderNumber}
          </p>
          <div className="space-x-4">
            <Button onClick={() => navigate("/my-bookings")}>
              View My Bookings
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const orderLine = order.lines[0];
  const listing = orderLine?.listingId;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Complete Your Booking
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <Card.Content className="p-6">
              <h2 className="text-lg font-semibold mb-4">Booking Details</h2>

              {listing && (
                <div className="flex space-x-4 mb-4">
                  <img
                    src={listing.images?.[0] || "/placeholder-image.jpg"}
                    alt={listing.title}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {listing.title}
                    </h3>
                    <p className="text-sm text-gray-600">{listing.location}</p>
                    <p className="text-sm text-gray-600">
                      Quantity: {orderLine.qty} •{" "}
                      {formatPrice(listing.basePrice)}/{listing.unitType}
                    </p>
                  </div>
                </div>
              )}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Check-in:</span>
                  <span>{formatDate(orderLine.start)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Check-out:</span>
                  <span>{formatDate(orderLine.end)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Duration:</span>
                  <span>
                    {Math.ceil(
                      (new Date(orderLine.end) - new Date(orderLine.start)) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    days
                  </span>
                </div>
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content className="p-6">
              <h2 className="text-lg font-semibold mb-4">Host Information</h2>
              {order.hostId && (
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-200 rounded-full p-2">
                    <svg
                      className="h-6 w-6 text-gray-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium">{order.hostId.name}</h4>
                    <p className="text-sm text-gray-600">
                      {order.hostId.hostProfile?.displayName || "Host"}
                    </p>
                  </div>
                </div>
              )}
            </Card.Content>
          </Card>
        </div>

        {/* Payment Section */}
        <div>
          <Card>
            <Card.Content className="p-6">
              <h2 className="text-lg font-semibold mb-4">Payment Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Deposit:</span>
                  <span>{formatPrice(order.depositAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform fee:</span>
                  <span>{formatPrice(order.platformCommission)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total to pay:</span>
                  <span>{formatPrice(order.totalAmount)}</span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium mb-3">Payment Method</h3>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="polar"
                      checked={paymentMethod === "polar"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <CreditCard className="h-5 w-5 mr-2 text-gray-600" />
                    <div>
                      <div className="font-medium">Polar.sh Payment</div>
                      <div className="text-sm text-gray-600">
                        Secure payment processing via Polar.sh
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mock"
                      checked={paymentMethod === "mock"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <CreditCard className="h-5 w-5 mr-2 text-gray-600" />
                    <div>
                      <div className="font-medium">Mock Payment (Demo)</div>
                      <div className="text-sm text-gray-600">
                        Simulated payment for demo purposes
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {order.paymentStatus === "pending" && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Demo Mode Active</p>
                        <p>
                          This is a demonstration. No real payment will be
                          processed.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Processing Payment...
                      </div>
                    ) : (
                      `Pay ${formatPrice(order.totalAmount)}`
                    )}
                  </Button>
                </div>
              )}

              <div className="mt-4 text-xs text-gray-500">
                <p>
                  By completing this booking, you agree to our Terms of Service
                  and Privacy Policy.
                </p>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
