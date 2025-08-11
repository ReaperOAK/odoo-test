import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ordersAPI } from "../lib/api";
import { Check, Clock, AlertCircle } from "lucide-react";
import Button from "../components/ui/Button";

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("processing"); // processing, success, error
  const [message, setMessage] = useState("");

  const orderId = searchParams.get("order_id");
  const sessionId = searchParams.get("session_id");

  const confirmPaymentMutation = useMutation({
    mutationFn: ({ orderId, sessionId }) =>
      ordersAPI.confirmPayment(orderId, { sessionId }),
    onSuccess: (data) => {
      setStatus("success");
      setMessage("Your payment has been confirmed and booking is complete!");
    },
    onError: (error) => {
      setStatus("error");
      setMessage(
        error.response?.data?.message || "Failed to confirm payment"
      );
    },
  });

  useEffect(() => {
    if (orderId && sessionId) {
      // Only confirm if using real Polar payment
      if (!sessionId.includes("mock")) {
        confirmPaymentMutation.mutate({ orderId, sessionId });
      } else {
        // For mock payments, just show success
        setStatus("success");
        setMessage("Mock payment processed successfully!");
      }
    } else {
      setStatus("error");
      setMessage("Missing payment information");
    }
  }, [orderId, sessionId]);

  if (status === "processing") {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <Clock className="h-6 w-6 text-blue-600 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Processing Payment...
          </h1>
          <p className="text-gray-600 mb-6">
            Please wait while we confirm your payment.
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Payment Error
          </h1>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="space-x-4">
            <Button onClick={() => navigate("/my-bookings")}>
              View My Bookings
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-6">{message}</p>
        {orderId && (
          <p className="text-sm text-gray-500 mb-6">Order ID: {orderId}</p>
        )}
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
};

export default CheckoutSuccess;
