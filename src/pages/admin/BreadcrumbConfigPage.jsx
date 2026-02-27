import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAbbreviations } from '../../utils/labelGenerator';

function BreadcrumbConfigPage() {
  const { user } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [abbreviations, setAbbreviations] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    fetchRouteMetadata();
    setAbbreviations(getAbbreviations());
  }, []);
  
  const fetchRouteMetadata = async () => {
    try {
      const response = await fetch('/api/routes/metadata', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRoutes(Object.entries(data.routes || {}).map(([path, config]) => ({
          path,
          ...config
        })));
      }
    } catch (error) {
      console.error('Failed to fetch route metadata:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const updateRouteConfig = async (routePath, updates) => {
    setSaving(true);
    try {
      const response = await fetch('/api/routes/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          routePath,
          ...updates
        })
      });
      
      if (response.ok) {
        setMessage('Configuration updated successfully');
        setTimeout(() => setMessage(''), 3000);
        await fetchRouteMetadata();
      } else {
        setMessage('Failed to update configuration');
      }
    } catch (error) {
      console.error('Failed to update route config:', error);
      setMessage('Error updating configuration');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 font-mono">
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 bg-zinc-800 rounded" />
            <div className="h-32 bg-zinc-800 rounded" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-zinc-200 font-mono">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="border border-zinc-700 p-6 mb-6">
          <h1 className="text-2xl text-green-400 mb-2">[ BREADCRUMB CONFIG ]</h1>
          <p className="text-zinc-400">
            Configure custom labels and visibility for breadcrumb navigation
          </p>
        </div>
        
        {message && (
          <div className={`border p-4 mb-6 ${
            message.includes('successfully') 
              ? 'border-green-600 text-green-400' 
              : 'border-red-600 text-red-400'
          }`}>
            {message}
          </div>
        )}
        
        {/* Route Configuration */}
        <div className="border border-zinc-700 mb-6">
          <div className="border-b border-zinc-700 p-4">
            <h2 className="text-lg text-green-400">Route Configurations</h2>
          </div>
          
          <div className="p-4 space-y-4">
            {routes.length === 0 ? (
              <p className="text-zinc-500">No route configurations found</p>
            ) : (
              routes.map((route) => (
                <RouteConfigRow
                  key={route.path}
                  route={route}
                  onUpdate={updateRouteConfig}
                  saving={saving}
                />
              ))
            )}
          </div>
        </div>
        
        {/* Abbreviations Reference */}
        <div className="border border-zinc-700">
          <div className="border-b border-zinc-700 p-4">
            <h2 className="text-lg text-green-400">Common Abbreviations</h2>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
              {Object.entries(abbreviations).map(([key, value]) => (
                <div key={key} className="flex justify-between text-zinc-400">
                  <span>{key}</span>
                  <span>→ {value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RouteConfigRow({ route, onUpdate, saving }) {
  const [customLabel, setCustomLabel] = useState(route.customLabel || '');
  const [hidden, setHidden] = useState(route.hidden || false);
  
  const handleUpdate = () => {
    onUpdate(route.path, {
      customLabel: customLabel.trim() || null,
      hidden
    });
  };
  
  return (
    <div className="border border-zinc-800 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-zinc-300">{route.path}</span>
        <button
          onClick={handleUpdate}
          disabled={saving}
          className="px-3 py-1 border border-zinc-600 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Update'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-zinc-400 mb-1">
            Custom Label
          </label>
          <input
            type="text"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="Leave empty for auto-generated"
            className="w-full bg-zinc-900 border border-zinc-700 p-2 text-zinc-200 focus:border-green-400 focus:outline-none"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 text-sm text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={hidden}
              onChange={(e) => setHidden(e.target.checked)}
              className="form-checkbox text-green-400"
            />
            <span>Hide from breadcrumbs</span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default BreadcrumbConfigPage;