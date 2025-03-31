
import React from "react";
import { cn } from "@/lib/utils";

interface PageTitleProps {
  title: string;
  description?: string;
  className?: string;
}

const PageTitle: React.FC<PageTitleProps> = ({ 
  title, 
  description, 
  className
}) => {
  return (
    <div className={cn("text-center mb-8", className)}>
      <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
        {title}
      </h1>
      {description && (
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {description}
        </p>
      )}
    </div>
  );
};

export default PageTitle;
