import { Link } from "react-router-dom";
import { MapPin, Star, User, Package, Tag } from "lucide-react";
import Card from "../ui/Card";

const ListingCard = ({ listing }) => {
  const {
    _id,
    title,
    images,
    basePrice,
    unitType,
    ownerId,
    location,
    totalQuantity,
    category,
    features,
  } = listing;

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  const getUnitLabel = (type) => {
    const labels = {
      hour: "/hr",
      day: "/day",
      week: "/week",
      month: "/month",
    };
    return labels[type] || "/day";
  };

  const getCategoryColor = (category) => {
    const colors = {
      electronics: "bg-blue-100 text-blue-800",
      vehicles: "bg-green-100 text-green-800",
      sports: "bg-orange-100 text-orange-800",
      music: "bg-purple-100 text-purple-800",
      tools: "bg-gray-100 text-gray-800",
      furniture: "bg-yellow-100 text-yellow-800",
      other: "bg-slate-100 text-slate-800",
    };
    return colors[category] || colors.other;
  };

  return (
    <Link to={`/listings/${_id}`}>
      <Card className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer">
        <div className="relative">
          <img
            src={images?.[0] || "/placeholder-image.jpg"}
            alt={title}
            className="w-full h-48 object-cover rounded-t-lg"
          />
          <div className="absolute top-2 left-2">
            <span
              className={`px-2 py-1 rounded-md text-xs font-medium ${getCategoryColor(
                category
              )}`}
            >
              {category?.charAt(0).toUpperCase() + category?.slice(1)}
            </span>
          </div>
          {totalQuantity && (
            <div className="absolute top-2 right-2">
              <span className="bg-green-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                <Package className="h-3 w-3 inline mr-1" />
                {totalQuantity} qty
              </span>
            </div>
          )}
        </div>

        <Card.Content className="p-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
              {title}
            </h3>

            {location && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-1" />
                {location}
              </div>
            )}

            {/* Key Features Preview */}
            {features && features.length > 0 && (
              <div className="flex items-center text-sm text-gray-600">
                <Star className="h-4 w-4 mr-1 text-yellow-500" />
                <span className="truncate">
                  {features.slice(0, 2).join(", ")}
                </span>
                {features.length > 2 && (
                  <span className="ml-1">+{features.length - 2} more</span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-gray-900">
                {formatPrice(basePrice)}
                <span className="text-sm font-normal text-gray-600">
                  {getUnitLabel(unitType)}
                </span>
              </div>
            </div>

            {ownerId && (
              <div className="flex items-center text-sm text-gray-600 pt-2 border-t">
                <div className="bg-gray-200 rounded-full p-1 mr-2">
                  <User className="h-3 w-3" />
                </div>
                <span>{ownerId.name || "Owner"}</span>
                {ownerId.hostProfile?.verified && (
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                    Verified
                  </span>
                )}
              </div>
            )}
          </div>
        </Card.Content>
      </Card>
    </Link>
  );
};

export default ListingCard;
