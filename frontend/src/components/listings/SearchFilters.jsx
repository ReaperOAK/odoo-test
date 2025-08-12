import { useState } from "react";
import { Filter, X, Search } from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";

const SearchFilters = ({ filters, setFilters }) => {
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { value: "electronics", label: "Electronics" },
    { value: "vehicles", label: "Vehicles" },
    { value: "sports", label: "Sports & Recreation" },
    { value: "music", label: "Music & Audio" },
    { value: "tools", label: "Tools & Equipment" },
    { value: "furniture", label: "Furniture" },
    { value: "other", label: "Other" },
  ];

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      priceMin: "",
      priceMax: "",
      startDate: "",
      endDate: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== "");

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="glass"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center font-semibold"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-2.5 py-1 font-bold shadow-lg">
              {Object.values(filters).filter((value) => value !== "").length}
            </span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="text-sm font-semibold"
          >
            <X className="h-4 w-4 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-gray-200 bg-gray-50/80 backdrop-blur-sm rounded-2xl p-6">
          {/* Mobile Search Input */}
          <div className="md:hidden">
            <label className="block text-sm lg:text-base font-bold text-gray-800 mb-2">
              Search Items
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <input
                type="text"
                placeholder="Search items..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:shadow-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm lg:text-base font-bold text-gray-800 mb-2">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-sm lg:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:shadow-md"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm lg:text-base font-bold text-gray-800 mb-2">
              Rental Start
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-sm lg:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:shadow-md"
            />
          </div>

          <div>
            <label className="block text-sm lg:text-base font-bold text-gray-800 mb-2">
              Rental End
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              min={filters.startDate || new Date().toISOString().split("T")[0]}
              className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-sm lg:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:shadow-md"
            />
          </div>

          <div>
            <label className="block text-sm lg:text-base font-bold text-gray-800 mb-2">
              Price Range
            </label>
            <div className="flex space-x-3">
              <input
                type="number"
                placeholder="Min ₹"
                value={filters.priceMin}
                onChange={(e) => handleFilterChange("priceMin", e.target.value)}
                className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-sm lg:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:shadow-md"
              />
              <input
                type="number"
                placeholder="Max ₹"
                value={filters.priceMax}
                onChange={(e) => handleFilterChange("priceMax", e.target.value)}
                className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-sm lg:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;
