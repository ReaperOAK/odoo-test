import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { listingsAPI, ordersAPI } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { Calendar, MapPin, User, Package, Shield, Clock } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [bookingData, setBookingData] = useState({
    startDate: "",
    endDate: "",
    quantity: 1,
    paymentOption: "deposit",
  });
  const [availabilityData, setAvailabilityData] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const {
    data: listing,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => listingsAPI.getById(id),
    select: (data) => data.data.listing,
  });

  const createOrderMutation = useMutation({
    mutationFn: ordersAPI.create,
    onSuccess: (data) => {
      navigate(`/checkout/${data.data.order._id}`);
    },
    onError: (error) => {
      alert(error.response?.data?.message || "Failed to create order");
    },
  });

  const checkAvailabilityMutation = useMutation({
    mutationFn: ({ start, end, qty }) =>
      listingsAPI.checkAvailability(id, { start, end, qty }),
    onSuccess: (data) => {
      setAvailabilityData(data.data);
    },
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  const calculateDuration = () => {
    if (!bookingData.startDate || !bookingData.endDate) return 0;
    const start = new Date(bookingData.startDate);
    const end = new Date(bookingData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateTotalPrice = () => {
    const duration = calculateDuration();
    const subtotal = listing?.basePrice * duration * bookingData.quantity;
    const deposit =
      listing?.depositType === "percent"
        ? subtotal * (listing?.depositValue / 100)
        : listing?.depositValue * bookingData.quantity;

    return {
      subtotal,
      deposit,
      duration,
    };
  };

  const handleBookingSubmit = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const { subtotal, deposit } = calculateTotalPrice();

    const orderData = {
      lines: [
        {
          listingId: id,
          qty: bookingData.quantity,
          start: new Date(bookingData.startDate).toISOString(),
          end: new Date(bookingData.endDate).toISOString(),
        },
      ],
      paymentOption: bookingData.paymentOption,
    };

    createOrderMutation.mutate(orderData);
  };

  const handleCheckAvailability = () => {
    if (bookingData.startDate && bookingData.endDate) {
      checkAvailabilityMutation.mutate({
        start: bookingData.startDate,
        end: bookingData.endDate,
        qty: bookingData.quantity,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="bg-gray-300 rounded-lg h-96 mb-6"></div>
          <div className="space-y-4">
            <div className="bg-gray-300 h-8 rounded w-3/4"></div>
            <div className="bg-gray-300 h-4 rounded w-1/2"></div>
            <div className="bg-gray-300 h-20 rounded"></div>
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
            Listing Not Found
          </h1>
          <p className="text-gray-600">
            The listing you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const isOwner = user?._id === listing?.ownerId?._id;
  const priceInfo = calculateTotalPrice();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Images and Details */}
        <div className="lg:col-span-2">
          {/* Image Gallery */}
          <div className="mb-6">
            <img
              src={listing?.images?.[0] || "/placeholder-image.jpg"}
              alt={listing?.title}
              className="w-full h-96 object-cover rounded-lg"
            />
            {listing?.images?.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {listing.images.slice(1, 5).map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${listing.title} ${index + 2}`}
                    className="w-full h-20 object-cover rounded-md"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Listing Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {listing?.title}
                </h1>
                <span className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">
                  {listing?.category?.charAt(0).toUpperCase() +
                    listing?.category?.slice(1)}
                </span>
              </div>

              <div className="flex items-center space-x-4 text-gray-600">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {listing?.location}
                </div>
                <div className="flex items-center">
                  <Package className="h-4 w-4 mr-1" />
                  {listing?.totalQuantity} available
                </div>
              </div>
            </div>

            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-600">{listing?.description}</p>
            </div>

            {/* Host Info */}
            {listing?.ownerId && (
              <Card>
                <Card.Content className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-200 rounded-full p-2">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{listing.ownerId.name}</h4>
                      <p className="text-sm text-gray-600">
                        {listing.ownerId.hostProfile?.displayName || "Host"}
                      </p>
                      {listing.ownerId.hostProfile?.verified && (
                        <div className="flex items-center mt-1">
                          <Shield className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-sm text-green-600">
                            Verified Host
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card.Content>
              </Card>
            )}
          </div>
        </div>

        {/* Booking Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <Card.Content className="p-6">
              <div className="mb-4">
                <div className="text-2xl font-bold text-gray-900">
                  {formatPrice(listing?.basePrice)}
                  <span className="text-base font-normal text-gray-600">
                    /{listing?.unitType}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {listing?.depositType === "percent" &&
                    `${listing?.depositValue}% deposit required`}
                  {listing?.depositType === "flat" &&
                    `${formatPrice(listing?.depositValue)} deposit required`}
                </div>
              </div>

              {!isOwner ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={bookingData.startDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) =>
                          setBookingData({
                            ...bookingData,
                            startDate: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={bookingData.endDate}
                        min={
                          bookingData.startDate ||
                          new Date().toISOString().split("T")[0]
                        }
                        onChange={(e) =>
                          setBookingData({
                            ...bookingData,
                            endDate: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <select
                      value={bookingData.quantity}
                      onChange={(e) =>
                        setBookingData({
                          ...bookingData,
                          quantity: parseInt(e.target.value),
                        })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                    >
                      {[...Array(Math.min(listing?.totalQuantity || 1, 5))].map(
                        (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {bookingData.startDate && bookingData.endDate && (
                    <div className="bg-gray-50 p-3 rounded-md space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Duration:</span>
                        <span>
                          {priceInfo.duration} {listing?.unitType}(s)
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>{formatPrice(priceInfo.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Deposit:</span>
                        <span>{formatPrice(priceInfo.deposit)}</span>
                      </div>
                      <hr />
                      <div className="flex justify-between font-semibold">
                        <span>Total to pay now:</span>
                        <span>{formatPrice(priceInfo.deposit)}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Option
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="paymentOption"
                          value="deposit"
                          checked={bookingData.paymentOption === "deposit"}
                          onChange={(e) =>
                            setBookingData({
                              ...bookingData,
                              paymentOption: e.target.value,
                            })
                          }
                          className="mr-2"
                        />
                        <span className="text-sm">Pay deposit now</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="paymentOption"
                          value="full"
                          checked={bookingData.paymentOption === "full"}
                          onChange={(e) =>
                            setBookingData({
                              ...bookingData,
                              paymentOption: e.target.value,
                            })
                          }
                          className="mr-2"
                        />
                        <span className="text-sm">Pay full amount now</span>
                      </label>
                    </div>
                  </div>

                  {availabilityData && (
                    <div
                      className={`p-3 rounded-md ${
                        availabilityData.available
                          ? "bg-green-50 text-green-800"
                          : "bg-red-50 text-red-800"
                      }`}
                    >
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        {availabilityData.available
                          ? "Available for selected dates"
                          : "Not available for selected dates"}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button
                      onClick={handleCheckAvailability}
                      variant="outline"
                      className="w-full"
                      disabled={!bookingData.startDate || !bookingData.endDate}
                    >
                      Check Availability
                    </Button>
                    <Button
                      onClick={handleBookingSubmit}
                      className="w-full"
                      disabled={
                        !bookingData.startDate ||
                        !bookingData.endDate ||
                        createOrderMutation.isPending
                      }
                    >
                      {createOrderMutation.isPending
                        ? "Creating Order..."
                        : "Book Now"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600">This is your listing</p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => navigate("/host/dashboard")}
                  >
                    Manage Listing
                  </Button>
                </div>
              )}
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;
