import * as React from "react"

const DropdownMenuContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({ open: false, setOpen: () => {} });

const DropdownMenu = ({ 
  children, 
  open: controlledOpen, 
  onOpenChange 
}: { 
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  
  const setOpen = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
};

const DropdownMenuTrigger = ({ children, asChild, onClick, ...props }: any) => {
  const { open, setOpen } = React.useContext(DropdownMenuContext);
  
  const handleClick = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(!open);
    onClick?.(e);
  };
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { ...props, onClick: handleClick });
  }
  return <button {...props} onClick={handleClick}>{children}</button>;
};

const DropdownMenuContent = ({ children, align = 'center', className = '' }: any) => {
  const { open, setOpen } = React.useContext(DropdownMenuContext);
  const alignClass = align === 'end' ? 'right-0' : align === 'start' ? 'left-0' : 'left-1/2 -translate-x-1/2';

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      <div className={`absolute z-50 mt-2 min-w-[8rem] rounded-md border bg-white p-1 shadow-md ${alignClass} ${className}`}>
        {children}
      </div>
    </>
  );
};

const DropdownMenuItem = ({ children, onClick, className = '' }: any) => {
  const { setOpen } = React.useContext(DropdownMenuContext);
  
  const handleClick = (e: any) => {
    e.stopPropagation();
    onClick?.(e);
    setOpen(false);
  };
  
  return (
    <div
      className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 ${className}`}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};

const DropdownMenuLabel = ({ children, className = '' }: any) => (
  <div className={`px-2 py-1.5 text-sm font-semibold ${className}`}>
    {children}
  </div>
);

const DropdownMenuSeparator = ({ className = '' }: any) => (
  <div className={`-mx-1 my-1 h-px bg-gray-200 ${className}`} />
);

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator }
