import * as React from "react"

const Tabs = ({ children, defaultValue, className = '' }: any) => {
  const [value, setValue] = React.useState(defaultValue);

  return (
    <div className={className}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, { currentValue: value, onValueChange: setValue });
        }
        return child;
      })}
    </div>
  );
};

const TabsList = ({ children, currentValue, onValueChange, className = '' }: any) => (
  <div className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 ${className}`}>
    {React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child as any, { currentValue, onValueChange });
      }
      return child;
    })}
  </div>
);

const TabsTrigger = ({ children, value, currentValue, onValueChange, className = '' }: any) => {
  const isActive = value === currentValue;
  
  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 ${
        isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
      } ${className}`}
      onClick={() => onValueChange?.(value)}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ children, value, currentValue, className = '' }: any) => {
  if (value !== currentValue) return null;
  
  return (
    <div className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 ${className}`}>
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent }
