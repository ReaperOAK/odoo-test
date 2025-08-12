import { useState, useEffect, useMemo } from "react";
import ListingCard from "../components/listings/ListingCard";
import SearchFilters from "../components/listings/SearchFilters";
import { Search, Filter } from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";
import { filterListings } from "../utils/searchUtils";
import { useData } from "../contexts/DataContext";

const Home = () => {
  const { state, actions } = useData();
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    priceMin: "",
    priceMax: "",
    startDate: "",
    endDate: "",
  });

  // Debounce search term to avoid too many API calls
  const debouncedSearch = useDebounce(filters.search, 500);

  // Transform filters to match backend API expectations (exclude search for immediate frontend filtering)
  const apiFilters = {
    search: "", // Don't send search to backend, handle it frontend
    category: filters.category,
    minPrice: filters.priceMin,
    maxPrice: filters.priceMax,
    from: filters.startDate,
    to: filters.endDate,
  };

  // Fetch listings when component mounts or filters change
  useEffect(() => {
    actions.fetchListings(apiFilters);
  }, [
    filters.category,
    filters.priceMin,
    filters.priceMax,
    filters.startDate,
    filters.endDate,
  ]);

  const allListings = state.listings || [];
  const isLoading = state.listingsLoading;
  const error = state.listingsError;

  // Frontend filtering for real-time search
  const filteredListings = useMemo(() => {
    // Start with all listings
    let result = allListings;

    // Apply search filter using utility function
    if (filters.search && filters.search.trim()) {
      result = filterListings(result, filters.search);
    }

    // Apply other filters if needed
    if (filters.category) {
      result = result.filter(
        (listing) =>
          listing.category?.toLowerCase() === filters.category.toLowerCase()
      );
    }

    if (filters.priceMin) {
      result = result.filter(
        (listing) => listing.basePrice >= parseFloat(filters.priceMin)
      );
    }

    if (filters.priceMax) {
      result = result.filter(
        (listing) => listing.basePrice <= parseFloat(filters.priceMax)
      );
    }

    return result;
  }, [allListings, filters]);

  const listings = filteredListings;

  return (
    <div className="relative min-h-screen">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-radial from-primary-400/20 to-transparent rounded-full animate-float"></div>
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-radial from-secondary-400/20 to-transparent rounded-full animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-radial from-purple-400/10 to-transparent rounded-full animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
        {/* Hero Section */}
        <div className="text-center mb-16 lg:mb-20">
          <h1 className="text-4xl lg:text-6xl xl:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-6 animate-slideInUp">
            Rent Anything, Anytime
          </h1>
          <p
            className="text-xl lg:text-2xl text-gray-700 mb-12 max-w-3xl mx-auto animate-slideInUp"
            style={{ animationDelay: "0.2s" }}
          >
            Discover thousands of items available for rent in your area with our
            flashy marketplace
          </p>

          {/* Search Bar */}
          <div
            className="max-w-3xl mx-auto animate-slideInUp"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="relative group">
              <Search
                className={`absolute left-4 lg:left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 lg:h-6 lg:w-6 transition-colors ${
                  filters.search
                    ? "text-blue-500"
                    : "text-gray-500 group-hover:text-blue-500"
                }`}
              />
              <input
                type="text"
                placeholder="Search for items to rent..."
                className="w-full pl-12 lg:pl-16 pr-6 py-4 lg:py-6 text-lg lg:text-xl bg-white/80 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:shadow-lg focus:shadow-xl placeholder-gray-500"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
              {filters.search && (
                <div className="absolute right-4 top-full mt-2 bg-gray-800 text-white text-sm px-3 py-1 rounded-lg shadow-lg z-10">
                  {listings.length} result{listings.length !== 1 ? "s" : ""}{" "}
                  found
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="animate-slideInUp" style={{ animationDelay: "0.6s" }}>
          <SearchFilters filters={filters} setFilters={setFilters} />
        </div>

        {/* Search Results Summary */}
        {(filters.search ||
          filters.category ||
          filters.priceMin ||
          filters.priceMax) && (
          <div className="mt-8 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="text-blue-800">
                <span className="font-semibold">{listings.length}</span> result
                {listings.length !== 1 ? "s" : ""} found
                {filters.search && (
                  <span className="ml-2">
                    for "<span className="font-medium">{filters.search}</span>"
                  </span>
                )}
              </div>
              {(filters.search ||
                filters.category ||
                filters.priceMin ||
                filters.priceMax) && (
                <button
                  onClick={() =>
                    setFilters({
                      search: "",
                      category: "",
                      priceMin: "",
                      priceMax: "",
                      startDate: "",
                      endDate: "",
                    })
                  }
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Listings Grid */}
        <div className="mt-12 lg:mt-16">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-white/70 rounded-2xl h-48 lg:h-56 mb-4"></div>
                  <div className="space-y-3">
                    <div className="bg-gray-200 h-4 rounded-full"></div>
                    <div className="bg-gray-200 h-4 rounded-full w-3/4"></div>
                    <div className="bg-gray-300 h-6 rounded-full w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16 lg:py-24">
              <div className="bg-white/80 rounded-2xl p-8 lg:p-12 max-w-md mx-auto shadow-lg">
                <p className="text-gray-600 text-lg lg:text-xl">
                  ❌ Error loading listings. Please try again.
                </p>
              </div>
            </div>
          ) : listings?.length === 0 ? (
            <div className="text-center py-16 lg:py-24">
              <div className="bg-white/80 rounded-2xl p-8 lg:p-12 max-w-md mx-auto shadow-lg">
                <p className="text-gray-600 text-lg lg:text-xl">
                  🔍 No listings found. Try adjusting your filters.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {listings?.map((listing, index) => (
                <div
                  key={listing._id}
                  className="animate-slideInUp"
                  style={{ animationDelay: `${0.1 * (index % 8)}s` }}
                >
                  <ListingCard listing={listing} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
