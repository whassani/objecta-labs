import * as React from "react"

const SelectContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  value?: string;
  onValueChange?: (value: string) => void;
  labels: Map<string, string>;
  registerLabel: (value: string, label: string) => void;
}>({ 
  open: false, 
  setOpen: () => {},
  value: undefined,
  onValueChange: undefined,
  labels: new Map(),
  registerLabel: () => {}
});

const Select = ({ children, value, onValueChange }: { 
  children: React.ReactNode; 
  value?: string; 
  onValueChange?: (value: string) => void;
}) => {
  const [open, setOpen] = React.useState(false);
  const [labels, setLabels] = React.useState<Map<string, string>>(new Map());

  const registerLabel = React.useCallback((value: string, label: string) => {
    setLabels(prev => {
      const newMap = new Map(prev);
      newMap.set(value, label);
      return newMap;
    });
  }, []);

  return (
    <SelectContext.Provider value={{ open, setOpen, value, onValueChange, labels, registerLabel }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = React.forwardRef<HTMLButtonElement, any>(
  ({ className = '', children, ...props }, ref) => {
    const { open, setOpen } = React.useContext(SelectContext);

    return (
      <button
        ref={ref}
        type="button"
        className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        {...props}
      >
        {children}
        <span className="ml-2">▼</span>
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const { value, labels } = React.useContext(SelectContext);
  
  // If there's a value, display its label
  if (value) {
    const label = labels.get(value);
    return <span>{label || value}</span>;
  }
  
  return <span className="text-gray-500">{placeholder || 'Select...'}</span>;
};

const SelectContent = ({ children }: any) => {
  const { open, setOpen } = React.useContext(SelectContext);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg">
        <div className="p-1">
          {children}
        </div>
      </div>
    </>
  );
};

const SelectItem = ({ value, children }: any) => {
  const { onValueChange, setOpen, registerLabel } = React.useContext(SelectContext);

  // Register the label when component mounts
  React.useEffect(() => {
    const label = typeof children === 'string' ? children : value;
    registerLabel(value, label);
  }, [value, children, registerLabel]);

  return (
    <div
      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100"
      onClick={(e) => {
        e.stopPropagation();
        onValueChange?.(value);
        setOpen(false);
      }}
    >
      {children}
    </div>
  );
};

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
