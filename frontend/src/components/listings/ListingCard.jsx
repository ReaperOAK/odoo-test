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
      electronics:
        "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25",
      vehicles:
        "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25",
      sports:
        "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25",
      music:
        "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25",
      tools:
        "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/25",
      furniture:
        "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/25",
      other:
        "bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg shadow-slate-500/25",
    };
    return colors[category] || colors.other;
  };

  return (
    <Link to={`/listings/${_id}`} className="group">
      <Card
        className="overflow-hidden group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-primary-500/20 transition-all duration-500 cursor-pointer border-0"
        variant="glass"
      >
        <div className="relative overflow-hidden">
          <img
            src={images?.[0] || "/placeholder-image.jpg"}
            alt={title}
            className="w-full h-48 lg:h-56 object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          <div className="absolute top-3 left-3">
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm ${getCategoryColor(
                category
              )} animate-float`}
            >
              <Tag className="h-3 w-3 inline mr-1" />
              {category?.charAt(0).toUpperCase() + category?.slice(1)}
            </span>
          </div>
          {totalQuantity && (
            <div className="absolute top-3 right-3">
              <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-green-500/25 backdrop-blur-sm animate-pulse-glow">
                <Package className="h-3 w-3 inline mr-1" />
                {totalQuantity} qty
              </span>
            </div>
          )}

          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        </div>

        <Card.Content className="p-6">
          <div className="space-y-4">
            <h3 className="font-bold text-lg lg:text-xl text-gray-900 group-hover:text-blue-600 transition-all duration-300 line-clamp-2">
              {title}
            </h3>

            {location && (
              <div className="flex items-center text-sm lg:text-base text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-1.5 rounded-full mr-2">
                  <MapPin className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
                </div>
                <span className="font-medium">{location}</span>
              </div>
            )}

            {/* Key Features Preview */}
            {features && features.length > 0 && (
              <div className="flex items-center text-sm lg:text-base text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-1.5 rounded-full mr-2">
                  <Star className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
                </div>
                <span className="truncate font-medium">
                  {features.slice(0, 2).join(", ")}
                </span>
                {features.length > 2 && (
                  <span className="ml-1 bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full text-xs font-bold">
                    +{features.length - 2}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <div className="text-xl lg:text-2xl font-bold text-gray-900">
                {formatPrice(basePrice)}
                <span className="text-sm lg:text-base font-semibold text-gray-600 ml-1">
                  {getUnitLabel(unitType)}
                </span>
              </div>
            </div>

            {ownerId && (
              <div className="flex items-center justify-between text-sm lg:text-base text-gray-600 pt-3 border-t border-gray-100">
                <div className="flex items-center">
                  <div className="bg-blue-600 rounded-full p-2 mr-3 shadow-lg">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold text-gray-700">
                    {ownerId.name || "Owner"}
                  </span>
                </div>
                {ownerId.hostProfile?.verified && (
                  <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg shadow-blue-500/25 animate-pulse-glow">
                    ✓ Verified
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
