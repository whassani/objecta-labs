'use client';

export default function PlansLoading() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
          </div>
          
          <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
          
          <div className="mb-4">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
          
          <div className="h-24 bg-gray-100 rounded mb-4"></div>
          
          <div className="h-20 bg-gray-50 rounded mb-4"></div>
          
          <div className="flex gap-2 pt-4 border-t">
            <div className="h-9 bg-gray-200 rounded flex-1"></div>
            <div className="h-9 bg-gray-200 rounded flex-1"></div>
            <div className="h-9 bg-gray-200 rounded w-12"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
