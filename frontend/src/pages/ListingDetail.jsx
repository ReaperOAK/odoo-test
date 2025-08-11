import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listingsAPI } from '../lib/api';

const ListingDetail = () => {
  const { id } = useParams();
  
  const { data: listing, isLoading, error } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsAPI.getById(id),
    select: (data) => data.data.listing,
  });

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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Listing Not Found</h1>
          <p className="text-gray-600">The listing you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <img
            src={listing?.images?.[0] || '/placeholder-image.jpg'}
            alt={listing?.title}
            className="w-full h-96 object-cover rounded-lg"
          />
        </div>

        {/* Details */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{listing?.title}</h1>
          <p className="text-xl text-primary-600 font-semibold mb-4">
            ${listing?.basePrice}/{listing?.unitType}
          </p>
          <p className="text-gray-600 mb-6">{listing?.description}</p>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Booking (Coming Soon)</h3>
            <p className="text-gray-600">Booking functionality will be implemented in the next phase.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;
