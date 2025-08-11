import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listingsAPI } from '../lib/api';
import ListingCard from '../components/listings/ListingCard';
import SearchFilters from '../components/listings/SearchFilters';
import { Search, Filter } from 'lucide-react';

const Home = () => {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    priceMin: '',
    priceMax: '',
    startDate: '',
    endDate: '',
  });

  const { data: listings, isLoading, error } = useQuery({
    queryKey: ['listings', filters],
    queryFn: () => listingsAPI.getAll(filters),
    select: (data) => data.data.listings,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Rent Anything, Anytime
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Discover thousands of items available for rent in your area
        </p>
        
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search for items to rent..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <SearchFilters filters={filters} setFilters={setFilters} />

      {/* Listings Grid */}
      <div className="mt-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-300 rounded-lg h-48 mb-4"></div>
                <div className="space-y-2">
                  <div className="bg-gray-300 h-4 rounded"></div>
                  <div className="bg-gray-300 h-4 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Error loading listings. Please try again.</p>
          </div>
        ) : listings?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No listings found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings?.map((listing) => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
