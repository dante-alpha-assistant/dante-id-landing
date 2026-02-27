import React from 'react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="bg-white">
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              How <span className="text-blue-600">Navigation Bar</span> Works
            </h1>
            <p className="text-xl text-gray-600">
              Learn how our navigation system provides consistent cross-page functionality
            </p>
          </div>

          <div className="space-y-16">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl mb-4">
                  1
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">Responsive Layout</h2>
                <p className="text-gray-600">
                  The navigation automatically adapts to different screen sizes, showing a horizontal menu on desktop and a hamburger menu on mobile devices.
                </p>
              </div>
              <div className="flex-1 bg-gray-50 p-8 rounded-lg">
                <div className="h-32 bg-white rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500">
                  Desktop/Mobile Preview
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row-reverse items-center gap-8">
              <div className="flex-1">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl mb-4">
                  2
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">Active State Detection</h2>
                <p className="text-gray-600">
                  The current page is automatically highlighted in the navigation, providing clear visual feedback to users about their location.
                </p>
              </div>
              <div className="flex-1 bg-gray-50 p-8 rounded-lg">
                <div className="h-32 bg-white rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500">
                  Active State Example
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl mb-4">
                  3
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">Sticky Behavior</h2>
                <p className="text-gray-600">
                  The navigation stays at the top of the screen when scrolling and adds a subtle shadow effect to maintain visual hierarchy.
                </p>
              </div>
              <div className="flex-1 bg-gray-50 p-8 rounded-lg">
                <div className="h-32 bg-white rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500">
                  Sticky Navigation Demo
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};