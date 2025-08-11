import { useSearchParams, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import Button from "../components/ui/Button";

const CheckoutCancel = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const orderId = searchParams.get("order_id");

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
          <AlertCircle className="h-6 w-6 text-yellow-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Payment Cancelled
        </h1>
        <p className="text-gray-600 mb-6">
          Your payment was cancelled. Your booking is still pending and you can try again.
        </p>
        {orderId && (
          <p className="text-sm text-gray-500 mb-6">Order ID: {orderId}</p>
        )}
        <div className="space-x-4">
          {orderId && (
            <Button onClick={() => navigate(`/checkout/${orderId}`)}>
              Try Payment Again
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate("/my-bookings")}>
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

export default CheckoutCancel;
