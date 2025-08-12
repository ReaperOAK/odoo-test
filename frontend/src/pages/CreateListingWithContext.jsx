import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useListingsState } from "../contexts/ListingsStateContext";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";

const CreateListingWithContext = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { createListing, loading, error, clearError } = useListingsState();

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

  const [validationErrors, setValidationErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) errors.title = "Title is required";
    else if (formData.title.length < 3)
      errors.title = "Title must be at least 3 characters";
    else if (formData.title.length > 100)
      errors.title = "Title must be less than 100 characters";

    if (!formData.description.trim())
      errors.description = "Description is required";
    else if (formData.description.length < 10)
      errors.description = "Description must be at least 10 characters";
    else if (formData.description.length > 2000)
      errors.description = "Description must be less than 2000 characters";

    if (!formData.basePrice) errors.basePrice = "Base price is required";
    else if (isNaN(formData.basePrice) || parseFloat(formData.basePrice) <= 0) {
      errors.basePrice = "Base price must be a positive number";
    }

    if (!formData.location.trim()) errors.location = "Location is required";
    else if (formData.location.length < 2)
      errors.location = "Location must be at least 2 characters";
    else if (formData.location.length > 200)
      errors.location = "Location must be less than 200 characters";

    if (!formData.totalQuantity) errors.totalQuantity = "Quantity is required";
    else if (
      isNaN(formData.totalQuantity) ||
      parseInt(formData.totalQuantity) <= 0
    ) {
      errors.totalQuantity = "Quantity must be a positive number";
    }

    if (!formData.depositValue)
      errors.depositValue = "Deposit value is required";
    else if (
      isNaN(formData.depositValue) ||
      parseFloat(formData.depositValue) < 0
    ) {
      errors.depositValue = "Deposit value must be a non-negative number";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Form submitted with data:", formData);
    console.log("User auth check - isHost:", user?.isHost);

    // Clear any previous errors
    clearError();

    // Validate form
    if (!validateForm()) {
      console.log("Form validation failed:", validationErrors);
      return;
    }

    // Check if user is host
    if (!user?.isHost) {
      setValidationErrors({ submit: "Only hosts can create listings" });
      return;
    }

    try {
      // Prepare data for API
      const listingData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        basePrice: parseFloat(formData.basePrice),
        unitType: formData.unitType,
        location: formData.location.trim(),
        totalQuantity: parseInt(formData.totalQuantity),
        deposit: {
          type: formData.depositType,
          value: parseFloat(formData.depositValue),
        },
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

      console.log("Sending listing data to API:", listingData);

      // Create listing using context
      const newListing = await createListing(listingData);

      console.log("Listing created successfully:", newListing);

      // Navigate to dashboard
      navigate("/host/dashboard-context");
    } catch (error) {
      console.error("Error in form submission:", error);
      // Error is already handled by the context
    }
  };

  const categories = [
    { value: "electronics", label: "Electronics" },
    { value: "vehicles", label: "Vehicles" },
    { value: "sports", label: "Sports & Recreation" },
    { value: "music", label: "Music & Audio" },
    { value: "tools", label: "Tools & Equipment" },
    { value: "furniture", label: "Furniture & Home" },
    { value: "other", label: "Other" },
  ];

  const unitTypes = [
    { value: "hour", label: "Per Hour" },
    { value: "day", label: "Per Day" },
    { value: "week", label: "Per Week" },
    { value: "month", label: "Per Month" },
  ];

  const depositTypes = [
    { value: "percent", label: "Percentage of Price" },
    { value: "fixed", label: "Fixed Amount" },
  ];

  if (!user?.isHost) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Become a Host
          </h1>
          <p className="text-gray-600 mb-6">
            You need to be a host to create listings. Please upgrade your
            account to start renting out your items.
          </p>
          <Button onClick={() => navigate("/profile")}>
            Upgrade to Host Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">List Your Item</h1>
        <p className="text-gray-600 mt-2">
          Create a new listing to rent out your item to others
        </p>
      </div>

      <Card>
        <Card.Content className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Basic Information
              </h2>

              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Item Title *
                </label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Professional DSLR Camera"
                  className={validationErrors.title ? "border-red-300" : ""}
                />
                {validationErrors.title && (
                  <p className="text-red-600 text-sm mt-1">
                    {validationErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your item, its condition, and any special features..."
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.description
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                />
                {validationErrors.description && (
                  <p className="text-red-600 text-sm mt-1">
                    {validationErrors.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="location"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Location *
                  </label>
                  <Input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="City, State"
                    className={
                      validationErrors.location ? "border-red-300" : ""
                    }
                  />
                  {validationErrors.location && (
                    <p className="text-red-600 text-sm mt-1">
                      {validationErrors.location}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing & Availability */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Pricing & Availability
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="basePrice"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Base Price (₹) *
                  </label>
                  <Input
                    id="basePrice"
                    name="basePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.basePrice}
                    onChange={handleInputChange}
                    placeholder="100"
                    className={
                      validationErrors.basePrice ? "border-red-300" : ""
                    }
                  />
                  {validationErrors.basePrice && (
                    <p className="text-red-600 text-sm mt-1">
                      {validationErrors.basePrice}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="unitType"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Pricing Unit *
                  </label>
                  <select
                    id="unitType"
                    name="unitType"
                    value={formData.unitType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {unitTypes.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="totalQuantity"
                    className="block text-sm font-medium text-gray-700 mb-1"
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
                    className={
                      validationErrors.totalQuantity ? "border-red-300" : ""
                    }
                  />
                  {validationErrors.totalQuantity && (
                    <p className="text-red-600 text-sm mt-1">
                      {validationErrors.totalQuantity}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="depositType"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Deposit Type *
                  </label>
                  <select
                    id="depositType"
                    name="depositType"
                    value={formData.depositType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {depositTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="depositValue"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Deposit Value *{" "}
                    {formData.depositType === "percent" ? "(%)" : "(₹)"}
                  </label>
                  <Input
                    id="depositValue"
                    name="depositValue"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.depositValue}
                    onChange={handleInputChange}
                    placeholder={
                      formData.depositType === "percent" ? "20" : "500"
                    }
                    className={
                      validationErrors.depositValue ? "border-red-300" : ""
                    }
                  />
                  {validationErrors.depositValue && (
                    <p className="text-red-600 text-sm mt-1">
                      {validationErrors.depositValue}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Additional Details
              </h2>

              <div>
                <label
                  htmlFor="features"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Features (comma-separated)
                </label>
                <Input
                  id="features"
                  name="features"
                  type="text"
                  value={formData.features}
                  onChange={handleInputChange}
                  placeholder="WiFi, GPS, 4K Recording, Wireless"
                />
                <p className="text-sm text-gray-500 mt-1">
                  List key features that make your item attractive to renters
                </p>
              </div>

              <div>
                <label
                  htmlFor="rules"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Rental Rules (comma-separated)
                </label>
                <Input
                  id="rules"
                  name="rules"
                  type="text"
                  value={formData.rules}
                  onChange={handleInputChange}
                  placeholder="No smoking, Handle with care, Return cleaned"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Set clear expectations for how renters should treat your item
                </p>
              </div>

              <div>
                <label
                  htmlFor="images"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Image URLs (comma-separated)
                </label>
                <Input
                  id="images"
                  name="images"
                  type="text"
                  value={formData.images}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Add URLs of images showing your item (optional but
                  recommended)
                </p>
              </div>
            </div>

            {/* Error Display */}
            {(error || validationErrors.submit) && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-600 text-sm">
                  {error?.message || validationErrors.submit}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/host/dashboard-context")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading.create}>
                {loading.create ? "Creating..." : "Create Listing"}
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
};

export default CreateListingWithContext;
