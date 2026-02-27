import React from 'react';

export const LandingPage: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-blue-600">Navigation Bar</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Add responsive navigation bar to landing page with links to login, signup, pricing, docs, and dashboard
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/signup" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Get Started
            </a>
            <a 
              href="/how-it-works" 
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:border-blue-600 hover:text-blue-600 transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Responsive Design</h3>
              <p className="text-gray-600">Works perfectly on desktop, tablet, and mobile devices with adaptive layouts.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Cross-Page Consistency</h3>
              <p className="text-gray-600">Navigation appears identical across all pages with proper active states.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Fast Loading</h3>
              <p className="text-gray-600">Optimized for quick loading without layout shifts or performance issues.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};