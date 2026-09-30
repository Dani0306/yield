import React from "react";

type PageContainerProps = {
  title?: string;
  description?: string;
  // Right side of the header, e.g. a "New bet" button.
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

// Standard wrapper for every page.tsx: optional header, then sections spaced
// evenly. Width and side padding come from the dashboard shell's <main>.
const PageContainer = ({
  title,
  description,
  actions,
  className = "",
  children,
}: PageContainerProps) => {
  const hasHeader = title || description || actions;

  return (
    <div className={`flex w-full flex-col gap-8 pt-2 ${className}`}>
      {hasHeader && (
        <header className="flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            {title && (
              <h1 className="text-2xl font-medium tracking-tight text-black">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-sm font-light text-gray-700">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </header>
      )}

      {children}
    </div>
  );
};

export default PageContainer;
