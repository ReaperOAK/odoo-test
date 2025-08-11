import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import Button from "../components/ui/Button";

const MockCheckout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const orderId = searchParams.get("order_id");
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // Auto-redirect to success page after 3 seconds for mock checkout
    const timer = setTimeout(() => {
      navigate(`/checkout/success?order_id=${orderId}&session_id=${sessionId}`);
    }, 3000);

    return () => clearTimeout(timer);
  }, [orderId, sessionId, navigate]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
          <Check className="h-6 w-6 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Mock Payment Processing
        </h1>
        <p className="text-gray-600 mb-6">
          This is a simulated payment page. In a real scenario, this would be the Polar.sh checkout page.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Redirecting to success page in a few seconds...
        </p>
        {orderId && (
          <p className="text-sm text-gray-400 mb-6">Order ID: {orderId}</p>
        )}
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 max-w-md mx-auto">
          <h3 className="font-medium text-blue-900 mb-2">Demo Payment Details</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>Payment Method: Mock/Demo</p>
            <p>Session ID: {sessionId}</p>
            <p>Status: Processing...</p>
          </div>
        </div>

        <div className="space-x-4">
          <Button 
            onClick={() => navigate(`/checkout/success?order_id=${orderId}&session_id=${sessionId}`)}
          >
            Complete Mock Payment
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate(`/checkout/cancel?order_id=${orderId}`)}
          >
            Cancel Payment
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MockCheckout;
