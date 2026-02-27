import React, { useState } from 'react';
import { ThemedButton } from '../components/themed/ThemedButton';
import { ThemedCard } from '../components/themed/ThemedCard';
import { ThemedDataTable } from '../components/themed/ThemedDataTable';
import { ThemedChart } from '../components/themed/ThemedChart';
import { ThemeToggle } from '../components/ThemeToggle';

interface ComponentShowcaseProps {
  selectedComponent?: string;
}

const sampleTableData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Moderator' },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'User' },
  { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', role: 'Admin' }
];

const sampleTableColumns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'role', label: 'Role', sortable: true }
];

const sampleChartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  datasets: [{
    label: 'Sales',
    data: [12, 19, 3, 5, 2]
  }]
};

export const ComponentLibraryShowcase: React.FC<ComponentShowcaseProps> = ({
  selectedComponent
}) => {
  const [activeTab, setActiveTab] = useState('buttons');
  
  const components = {
    buttons: (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Button Variants</h3>
          <div className="flex flex-wrap gap-4">
            <ThemedButton variant="primary">Primary</ThemedButton>
            <ThemedButton variant="secondary">Secondary</ThemedButton>
            <ThemedButton variant="outline">Outline</ThemedButton>
            <ThemedButton variant="ghost">Ghost</ThemedButton>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Button Sizes</h3>
          <div className="flex items-end gap-4">
            <ThemedButton size="sm">Small</ThemedButton>
            <ThemedButton size="md">Medium</ThemedButton>
            <ThemedButton size="lg">Large</ThemedButton>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Disabled State</h3>
          <div className="flex gap-4">
            <ThemedButton disabled>Disabled Primary</ThemedButton>
            <ThemedButton variant="secondary" disabled>Disabled Secondary</ThemedButton>
          </div>
        </div>
      </div>
    ),
    
    cards: (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Card Variants</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ThemedCard elevation="sm">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Small Elevation</h4>
              <p className="text-gray-600 dark:text-gray-400 mt-2">This card has a small shadow elevation.</p>
            </ThemedCard>
            
            <ThemedCard elevation="lg">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Large Elevation</h4>
              <p className="text-gray-600 dark:text-gray-400 mt-2">This card has a large shadow elevation.</p>
            </ThemedCard>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Card with Header and Footer</h3>
          <ThemedCard
            header={<h4 className="font-semibold text-gray-900 dark:text-gray-100">Card Header</h4>}
            footer={<div className="text-right"><ThemedButton size="sm">Action</ThemedButton></div>}
          >
            <p className="text-gray-600 dark:text-gray-400">
              This is the main content area of the card. It can contain any content you need.
            </p>
          </ThemedCard>
        </div>
      </div>
    ),
    
    tables: (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Basic Table</h3>
          <ThemedDataTable
            data={sampleTableData}
            columns={sampleTableColumns}
          />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Sortable and Filterable Table</h3>
          <ThemedDataTable
            data={sampleTableData}
            columns={sampleTableColumns}
            sortable
            filterable
          />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Table with Pagination</h3>
          <ThemedDataTable
            data={[...sampleTableData, ...sampleTableData, ...sampleTableData]}
            columns={sampleTableColumns}
            sortable
            filterable
            pagination
          />
        </div>
      </div>
    ),
    
    charts: (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Chart Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ThemedCard>
              <h4 className="font-medium mb-4 text-gray-900 dark:text-gray-100">Bar Chart</h4>
              <ThemedChart type="bar" data={sampleChartData} width={300} height={200} />
            </ThemedCard>
            
            <ThemedCard>
              <h4 className="font-medium mb-4 text-gray-900 dark:text-gray-100">Line Chart</h4>
              <ThemedChart type="line" data={sampleChartData} width={300} height={200} />
            </ThemedCard>
            
            <ThemedCard>
              <h4 className="font-medium mb-4 text-gray-900 dark:text-gray-100">Pie Chart</h4>
              <ThemedChart type="pie" data={sampleChartData} width={300} height={200} />
            </ThemedCard>
            
            <ThemedCard>
              <h4 className="font-medium mb-4 text-gray-900 dark:text-gray-100">Doughnut Chart</h4>
              <ThemedChart type="doughnut" data={sampleChartData} width={300} height={200} />
            </ThemedCard>
          </div>
        </div>
      </div>
    )
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Dark Mode Test
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Component Library Showcase
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <nav className="flex space-x-1">
            {Object.keys(components).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="space-y-8">
          {components[activeTab as keyof typeof components]}
        </div>
      </div>
    </div>
  );
};