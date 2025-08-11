import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { listingsAPI } from '../lib/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

const CreateListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'electronics',
    basePrice: '',
    unitType: 'day',
    location: '',
    totalQuantity: '1',
    depositType: 'percent',
    depositValue: '20',
    features: '',
    rules: '',
    images: ''
  });

  const [errors, setErrors] = useState({});

  const createListingMutation = useMutation({
    mutationFn: listingsAPI.create,
    onSuccess: (response) => {
      console.log('Listing created successfully:', response);
      queryClient.invalidateQueries({ queryKey: ['hostListings'] });
      navigate('/host/dashboard');
    },
    onError: (error) => {
      console.error('Error creating listing:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to create listing' });
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.basePrice || formData.basePrice <= 0) newErrors.basePrice = 'Valid price is required';
    if (!formData.totalQuantity || formData.totalQuantity <= 0) newErrors.totalQuantity = 'Quantity must be at least 1';

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
      features: formData.features ? formData.features.split(',').map(f => f.trim()).filter(f => f) : [],
      rules: formData.rules ? formData.rules.split(',').map(r => r.trim()).filter(r => r) : [],
      images: formData.images ? formData.images.split(',').map(img => img.trim()).filter(img => img) : []
    };

    createListingMutation.mutate(submitData);
  };

  // Redirect if not a host
  if (user && user.role !== 'host') {
    navigate('/');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">List Your Item</h1>
          <p className="text-gray-600 mt-2">Share your items with others and earn money while they're not in use</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Item Title *
              </label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Professional DSLR Camera Kit"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
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
                  errors.description ? 'border-red-500' : ''
                }`}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* Category and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
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
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="City, State"
                  className={errors.location ? 'border-red-500' : ''}
                />
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className={errors.basePrice ? 'border-red-500' : ''}
                />
                {errors.basePrice && <p className="text-red-500 text-sm mt-1">{errors.basePrice}</p>}
              </div>
              <div>
                <label htmlFor="unitType" className="block text-sm font-medium text-gray-700 mb-2">
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
                <label htmlFor="totalQuantity" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className={errors.totalQuantity ? 'border-red-500' : ''}
                />
                {errors.totalQuantity && <p className="text-red-500 text-sm mt-1">{errors.totalQuantity}</p>}
              </div>
              <div>
                <label htmlFor="depositType" className="block text-sm font-medium text-gray-700 mb-2">
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
                <label htmlFor="depositValue" className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit Value
                </label>
                <Input
                  id="depositValue"
                  name="depositValue"
                  type="number"
                  min="0"
                  max={formData.depositType === 'percent' ? "100" : undefined}
                  step="0.01"
                  value={formData.depositValue}
                  onChange={handleInputChange}
                  placeholder={formData.depositType === 'percent' ? "20" : "500"}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.depositType === 'percent' ? 'Percentage of item value' : 'Fixed amount in ₹'}
                </p>
              </div>
            </div>

            {/* Features */}
            <div>
              <label htmlFor="features" className="block text-sm font-medium text-gray-700 mb-2">
                Key Features
              </label>
              <Input
                id="features"
                name="features"
                value={formData.features}
                onChange={handleInputChange}
                placeholder="Image Stabilization, 4K Video, Weather Resistant (comma separated)"
              />
              <p className="text-sm text-gray-500 mt-1">List the main features that make your item attractive</p>
            </div>

            {/* Rules */}
            <div>
              <label htmlFor="rules" className="block text-sm font-medium text-gray-700 mb-2">
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
              <p className="text-sm text-gray-500 mt-1">Set clear expectations for renters</p>
            </div>

            {/* Images */}
            <div>
              <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
                Image URLs
              </label>
              <Input
                id="images"
                name="images"
                value={formData.images}
                onChange={handleInputChange}
                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg (comma separated)"
              />
              <p className="text-sm text-gray-500 mt-1">Add multiple images to showcase your item</p>
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
                onClick={() => navigate('/host/dashboard')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createListingMutation.isPending}
                className="flex-1"
              >
                {createListingMutation.isPending ? 'Creating Listing...' : 'Create Listing'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CreateListing;
