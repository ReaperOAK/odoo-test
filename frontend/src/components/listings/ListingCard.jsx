import { Link } from 'react-router-dom';
import { MapPin, Star, User } from 'lucide-react';
import Card from '../ui/Card';

const ListingCard = ({ listing }) => {
  const {
    _id,
    title,
    images,
    basePrice,
    unitType,
    owner,
    location,
    rating,
    totalQuantity,
    category
  } = listing;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getUnitLabel = (type) => {
    const labels = {
      hour: '/hour',
      day: '/day',
      week: '/week',
      month: '/month',
    };
    return labels[type] || '/day';
  };

  return (
    <Link to={`/listings/${_id}`}>
      <Card className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer">
        <div className="relative">
          <img
            src={images?.[0] || '/placeholder-image.jpg'}
            alt={title}
            className="w-full h-48 object-cover rounded-t-lg"
          />
          <div className="absolute top-2 left-2">
            <span className="bg-white px-2 py-1 rounded-md text-xs font-medium text-gray-700">
              {category}
            </span>
          </div>
          {totalQuantity && (
            <div className="absolute top-2 right-2">
              <span className="bg-green-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                {totalQuantity} available
              </span>
            </div>
          )}
        </div>
        
        <Card.Content className="p-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary-600 transition-colors">
              {title}
            </h3>
            
            {location && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-1" />
                {location.city}, {location.state}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-gray-900">
                {formatPrice(basePrice)}
                <span className="text-sm font-normal text-gray-600">
                  {getUnitLabel(unitType)}
                </span>
              </div>
              
              {rating && (
                <div className="flex items-center text-sm text-gray-600">
                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                  {rating.toFixed(1)}
                </div>
              )}
            </div>
            
            {owner && (
              <div className="flex items-center text-sm text-gray-600 pt-2 border-t">
                <div className="bg-gray-200 rounded-full p-1 mr-2">
                  <User className="h-3 w-3" />
                </div>
                <span>{owner.name}</span>
                {owner.verified && (
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
