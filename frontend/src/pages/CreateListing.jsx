import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { listingsAPI } from "../lib/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";

const CreateListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { actions } = useData();

  // Debug user info
  console.log("Current user in CreateListing:", user);
  console.log("User isHost:", user?.isHost);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "electronics",
    basePrice: "",
    unitType: "day",
    location: "",
    totalQuantity: "1",
    depositType: "percent",
    depositValue: "20",
    features: "",
    rules: "",
    images: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createListing = async (data) => {
    setIsSubmitting(true);
    try {
      console.log("Creating listing...", data);
      const response = await listingsAPI.create(data);
      console.log("Listing created successfully:", response);

      // Refresh data using context actions
      try {
        await actions.fetchListings();
        console.log("Listings refreshed successfully");
      } catch (refreshError) {
        console.warn("Failed to refresh listings:", refreshError);
      }

      console.log("Data refreshed, navigating to dashboard...");
      navigate("/host/dashboard");
    } catch (error) {
      console.error("Error creating listing:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.trim().length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    } else if (formData.title.trim().length > 200) {
      newErrors.title = "Title cannot exceed 200 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    } else if (formData.description.trim().length > 2000) {
      newErrors.description = "Description cannot exceed 2000 characters";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    } else if (formData.location.trim().length < 2) {
      newErrors.location = "Location must be at least 2 characters";
    } else if (formData.location.trim().length > 200) {
      newErrors.location = "Location cannot exceed 200 characters";
    }

    if (!formData.basePrice || formData.basePrice <= 0) {
      newErrors.basePrice = "Valid price is required";
    } else if (formData.basePrice > 1000000) {
      newErrors.basePrice = "Price cannot exceed ₹10,00,000";
    }

    if (!formData.totalQuantity || formData.totalQuantity <= 0) {
      newErrors.totalQuantity = "Quantity must be at least 1";
    } else if (formData.totalQuantity > 1000) {
      newErrors.totalQuantity = "Quantity cannot exceed 1000";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Format data for API
    const submitData = {
      ...formData,
      basePrice: parseFloat(formData.basePrice),
      totalQuantity: parseInt(formData.totalQuantity),
      depositValue: parseFloat(formData.depositValue),
      features: formData.features
        ? formData.features
            .split(",")
            .map((f) => f.trim())
            .filter((f) => f)
        : [],
      rules: formData.rules
        ? formData.rules
            .split(",")
            .map((r) => r.trim())
            .filter((r) => r)
        : [],
      images: formData.images
        ? formData.images
            .split(",")
            .map((img) => img.trim())
            .filter((img) => img)
        : [],
    };

    console.log("Submitting listing data:", submitData);

    try {
      await createListing(submitData);
    } catch (error) {
      console.error("Error creating listing:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error status:", error.response?.status);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create listing";
      const validationErrors = error.response?.data?.errors || [];
      console.error("Validation errors:", validationErrors);
      setErrors({ submit: errorMessage });
    }
  };

  // Redirect if not a host
  if (user && !user.isHost) {
    navigate("/");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">List Your Item</h1>
          <p className="text-gray-600 mt-2">
            Share your items with others and earn money while they're not in use
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Item Title *
              </label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Professional DSLR Camera Kit"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Describe your item, its condition, what's included, and any special instructions..."
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.description ? "border-red-500" : ""
                }`}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Category and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="electronics">Electronics</option>
                  <option value="vehicles">Vehicles</option>
                  <option value="sports">Sports & Recreation</option>
                  <option value="music">Music & Audio</option>
                  <option value="tools">Tools & Equipment</option>
                  <option value="furniture">Furniture</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Location *
                </label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="City, State"
                  className={errors.location ? "border-red-500" : ""}
                />
                {errors.location && (
                  <p className="text-red-500 text-sm mt-1">{errors.location}</p>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="basePrice"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Base Price (₹) *
                </label>
                <Input
                  id="basePrice"
                  name="basePrice"
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={handleInputChange}
                  placeholder="50"
                  className={errors.basePrice ? "border-red-500" : ""}
                />
                {errors.basePrice && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.basePrice}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="unitType"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Price Per *
                </label>
                <select
                  id="unitType"
                  name="unitType"
                  value={formData.unitType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="hour">Hour</option>
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                </select>
              </div>
            </div>

            {/* Quantity and Deposit */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="totalQuantity"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Available Quantity *
                </label>
                <Input
                  id="totalQuantity"
                  name="totalQuantity"
                  type="number"
                  min="1"
                  value={formData.totalQuantity}
                  onChange={handleInputChange}
                  placeholder="1"
                  className={errors.totalQuantity ? "border-red-500" : ""}
                />
                {errors.totalQuantity && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.totalQuantity}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="depositType"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Deposit Type
                </label>
                <select
                  id="depositType"
                  name="depositType"
                  value={formData.depositType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="percent">Percentage</option>
                  <option value="flat">Flat Amount</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="depositValue"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Deposit Value
                </label>
                <Input
                  id="depositValue"
                  name="depositValue"
                  type="number"
                  min="0"
                  max={formData.depositType === "percent" ? "100" : undefined}
                  step="0.01"
                  value={formData.depositValue}
                  onChange={handleInputChange}
                  placeholder={
                    formData.depositType === "percent" ? "20" : "500"
                  }
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.depositType === "percent"
                    ? "Percentage of item value"
                    : "Fixed amount in ₹"}
                </p>
              </div>
            </div>

            {/* Features */}
            <div>
              <label
                htmlFor="features"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Key Features
              </label>
              <Input
                id="features"
                name="features"
                value={formData.features}
                onChange={handleInputChange}
                placeholder="Image Stabilization, 4K Video, Weather Resistant (comma separated)"
              />
              <p className="text-sm text-gray-500 mt-1">
                List the main features that make your item attractive
              </p>
            </div>

            {/* Rules */}
            <div>
              <label
                htmlFor="rules"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Rental Rules
              </label>
              <textarea
                id="rules"
                name="rules"
                value={formData.rules}
                onChange={handleInputChange}
                rows={3}
                placeholder="Handle with care, No water exposure, Return with all accessories (comma separated for multiple rules)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Set clear expectations for renters
              </p>
            </div>

            {/* Images */}
            <div>
              <label
                htmlFor="images"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Image URLs
              </label>
              <Input
                id="images"
                name="images"
                value={formData.images}
                onChange={handleInputChange}
                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg (comma separated)"
              />
              <p className="text-sm text-gray-500 mt-1">
                Add multiple images to showcase your item
              </p>
            </div>

            {/* Error message */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-600 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/host/dashboard")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Creating Listing..." : "Create Listing"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CreateListing;
