import React from 'react';

export const PricingPage: React.FC = () => {
  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      description: 'Perfect for small projects and personal use',
      features: [
        'Basic navigation components',
        'Responsive design',
        'Active state detection',
        'Community support'
      ],
      cta: 'Get Started',
      highlighted: false
    },
    {
      name: 'Professional',
      price: '$19/month',
      description: 'For growing businesses and teams',
      features: [
        'All Starter features',
        'Advanced customization',
        'Analytics tracking',
        'Priority support',
        'Custom branding'
      ],
      cta: 'Start Free Trial',
      highlighted: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large organizations with specific needs',
      features: [
        'All Professional features',
        'White-label solution',
        'Dedicated support',
        'SLA guarantee',
        'Custom integrations'
      ],
      cta: 'Contact Sales',
      highlighted: false
    }
  ];

  return (
    <div className="bg-white">
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Simple, Transparent <span className="text-blue-600">Pricing</span>
            </h1>
            <p className="text-xl text-gray-600">
              Choose the perfect plan for your navigation needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-lg shadow-lg p-8 ${
                  plan.highlighted ? 'ring-2 ring-blue-600 scale-105' : 'border border-gray-200'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-blue-600 mb-2">{plan.price}</div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    plan.highlighted
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};