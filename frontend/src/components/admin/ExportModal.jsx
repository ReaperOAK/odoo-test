import { useState } from 'react';
import { formatOptions } from '../../utils/exportUtils';
import Button from '../ui/Button';
import Card from '../ui/Card';

const ExportModal = ({ 
  isOpen, 
  onClose, 
  onExport, 
  title = "Export Data", 
  description = "Choose your preferred export format",
  dataPreview = null
}) => {
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(selectedFormat);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 p-0">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">{description}</p>
          
          {/* Format Selection */}
          <div className="space-y-3 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Export Format:
            </label>
            {formatOptions.map((option) => (
              <div key={option.value} className="flex items-center">
                <input
                  type="radio"
                  id={option.value}
                  name="exportFormat"
                  value={option.value}
                  checked={selectedFormat === option.value}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="mr-3 text-blue-600"
                />
                <label htmlFor={option.value} className="flex items-center cursor-pointer flex-1">
                  <span className="text-lg mr-2">{option.icon}</span>
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                </label>
              </div>
            ))}
          </div>

          {/* Data Preview */}
          {dataPreview && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Preview:
              </label>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <div className="font-medium">Records to export: {dataPreview.count}</div>
                {dataPreview.sample && (
                  <div className="text-gray-600 mt-1">
                    Sample: {dataPreview.sample}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Format Info */}
          <div className="bg-blue-50 p-3 rounded mb-6">
            <div className="text-sm text-blue-800">
              {selectedFormat === 'csv' && '📊 Best for spreadsheet applications like Excel'}
              {selectedFormat === 'json' && '🔧 Best for developers and data processing'}
              {selectedFormat === 'txt' && '📄 Best for simple text viewing and printing'}
              {selectedFormat === 'html' && '🌐 Best for viewing in web browsers with formatting'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="flex-1"
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleExport}
              className="flex-1"
              disabled={isExporting}
            >
              {isExporting ? '⏳ Exporting...' : `📥 Export ${selectedFormat.toUpperCase()}`}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ExportModal;
