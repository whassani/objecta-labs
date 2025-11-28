import * as React from "react"

const Dialog = ({ 
  children, 
  open, 
  onOpenChange 
}: { 
  children: React.ReactNode; 
  open?: boolean; 
  onOpenChange?: (open: boolean) => void;
}) => {
  const [isOpen, setIsOpen] = React.useState(open || false);

  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          if (child.type === DialogTrigger) {
            return React.cloneElement(child as any, {
              onClick: () => handleOpenChange(true)
            });
          }
          if (child.type === DialogContent) {
            return isOpen ? React.cloneElement(child as any, {
              onClose: () => handleOpenChange(false)
            }) : null;
          }
        }
        return child;
      })}
    </>
  );
};

const DialogTrigger = ({ children, asChild, ...props }: any) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, props);
  }
  return <div {...props}>{children}</div>;
};

const DialogContent = ({ children, onClose, className = '' }: any) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white rounded-lg shadow-lg p-6 max-w-lg w-full mx-4 ${className}`}>
        {children}
      </div>
    </div>
  );
};

const DialogHeader = ({ children, className = '' }: any) => (
  <div className={`flex flex-col space-y-1.5 text-center sm:text-left mb-4 ${className}`}>
    {children}
  </div>
);

const DialogTitle = ({ children, className = '' }: any) => (
  <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h2>
);

const DialogDescription = ({ children, className = '' }: any) => (
  <p className={`text-sm text-gray-600 ${className}`}>
    {children}
  </p>
);

const DialogFooter = ({ children, className = '' }: any) => (
  <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4 ${className}`}>
    {children}
  </div>
);

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter }
