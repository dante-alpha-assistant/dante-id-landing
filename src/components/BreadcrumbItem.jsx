import React from 'react';
// Placeholder: BreadcrumbLink (auto-inlined);

const BreadcrumbItem = ({ label, path, isActive }) => {
  if (isActive) {
    return (
      <span className="text-md-primary font-medium px-2 py-1">
        {label}
      </span>
    );
  }

  return (
    <BreadcrumbLink
      to={path}
      aria-label={`Navigate to ${label}`}
    >
      {label}
    </BreadcrumbLink>
  );
};

export default BreadcrumbItem;
function BreadcrumbLink(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[BreadcrumbLink]</div>; }
