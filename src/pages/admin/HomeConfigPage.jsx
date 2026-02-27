import React, { useState } from 'react';
import { useBreadcrumbConfig } from '../../hooks/useBreadcrumbConfig';
import { validateHomeRoute, getDefaultHomeConfig } from '../../utils/homeUtils';
import HomeIcon from '../../components/HomeIcon';

const HomeConfigPage = () => {
  const { config, updateConfig, isLoading } = useBreadcrumbConfig();
  const [formData, setFormData] = useState({
    home_route: config.home_route || '/dashboard',
    home_label: config.home_label || 'Dashboard',
    home_icon: config.home_icon || 'home',
    show_icons: config.show_icons !== undefined ? config.show_icons : true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateHomeRoute(formData.home_route)) {
      setMessage({ type: 'error', text: 'Please enter a valid route path (e.g., /dashboard)' });
      return;
    }

    setIsSaving(true);
    setMessage({ type: '', text: '' });

    const success = await updateConfig(formData);
    
    if (success) {
      setMessage({ type: 'success', text: 'Home link configuration saved successfully!' });
    } else {
      setMessage({ type: 'error', text: 'Failed to save configuration. Please try again.' });
    }
    
    setIsSaving(false);
  };

  const handleReset = () => {
    const defaults = getDefaultHomeConfig();
    setFormData(defaults);
    setMessage({ type: '', text: '' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-md-background p-6">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-md-surface-variant rounded w-64 mb-6"></div>
            <div className="bg-md-surface-container rounded-md-lg p-6">
              <div className="space-y-6">
                <div className="h-4 bg-md-surface-variant rounded w-32"></div>
                <div className="h-14 bg-md-surface-variant rounded"></div>
                <div className="h-4 bg-md-surface-variant rounded w-32"></div>
                <div className="h-14 bg-md-surface-variant rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-md-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-md-on-background mb-2">
            Breadcrumb Nav - Home Link Configuration
          </h1>
          <p className="text-md-on-surface-variant">
            Configure the home link that appears as the first item in breadcrumb navigation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-md-surface-container rounded-md-lg p-6 shadow-sm">
          {/* Home Route */}
          <div className="mb-6">
            <label htmlFor="home_route" className="block text-sm font-medium text-md-on-surface mb-2">
              Home Route Path
            </label>
            <input
              type="text"
              id="home_route"
              name="home_route"
              value={formData.home_route}
              onChange={handleInputChange}
              placeholder="/dashboard"
              className="w-full h-14 px-4 bg-md-surface-variant border-b-2 border-md-border rounded-t-lg rounded-b-none focus:border-md-primary focus:outline-none text-md-on-surface"
              required
            />
            <p className="text-xs text-md-on-surface-variant mt-1">
              The route users navigate to when clicking the home breadcrumb
            </p>
          </div>

          {/* Home Label */}
          <div className="mb-6">
            <label htmlFor="home_label" className="block text-sm font-medium text-md-on-surface mb-2">
              Home Label
            </label>
            <input
              type="text"
              id="home_label"
              name="home_label"
              value={formData.home_label}
              onChange={handleInputChange}
              placeholder="Dashboard"
              className="w-full h-14 px-4 bg-md-surface-variant border-b-2 border-md-border rounded-t-lg rounded-b-none focus:border-md-primary focus:outline-none text-md-on-surface"
              required
            />
            <p className="text-xs text-md-on-surface-variant mt-1">
              The text displayed for the home breadcrumb item
            </p>
          </div>

          {/* Home Icon */}
          <div className="mb-6">
            <label htmlFor="home_icon" className="block text-sm font-medium text-md-on-surface mb-2">
              Home Icon
            </label>
            <select
              id="home_icon"
              name="home_icon"
              value={formData.home_icon}
              onChange={handleInputChange}
              className="w-full h-14 px-4 bg-md-surface-variant border-b-2 border-md-border rounded-t-lg rounded-b-none focus:border-md-primary focus:outline-none text-md-on-surface"
            >
              <option value="home">Home</option>
              <option value="dashboard">Dashboard</option>
              <option value="house">House</option>
            </select>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-md-on-surface-variant">Preview:</span>
              <HomeIcon size={20} className="text-md-on-surface" />
            </div>
          </div>

          {/* Show Icons Toggle */}
          <div className="mb-8">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="show_icons"
                checked={formData.show_icons}
                onChange={handleInputChange}
                className="w-5 h-5 text-md-primary bg-md-surface-variant border-md-border rounded focus:ring-md-primary focus:ring-2"
              />
              <div>
                <span className="text-sm font-medium text-md-on-surface">Show Icons</span>
                <p className="text-xs text-md-on-surface-variant">
                  Display icons next to breadcrumb labels
                </p>
              </div>
            </label>
          </div>

          {/* Message Display */}
          {message.text && (
            <div className={`p-4 rounded-lg mb-6 ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-md-primary text-md-on-primary px-6 py-2.5 rounded-full font-medium hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2.5 border border-md-border text-md-on-surface rounded-full font-medium hover:bg-md-surface-variant transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </form>

        {/* Preview Section */}
        <div className="mt-8 bg-md-surface-container rounded-md-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-md-on-surface mb-4">Preview</h3>
          <div className="border border-md-border rounded-lg p-4 bg-md-background">
            <div className="flex items-center gap-2 text-sm">
              {formData.show_icons && <HomeIcon size={16} className="text-md-primary" />}
              <span className="text-md-primary hover:underline cursor-pointer">
                {formData.home_label}
              </span>
              <span className="text-md-on-surface-variant">/</span>
              <span className="text-md-on-surface-variant">current-page</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeConfigPage;