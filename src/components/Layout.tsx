import React from 'react';
// Placeholder: NavigationBar (auto-inlined);

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};
function NavigationBar(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[NavigationBar]</div>; }
