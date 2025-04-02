
import React from "react";
import { cn } from "@/lib/utils";

interface SectionContainerProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
}

const SectionContainer: React.FC<SectionContainerProps> = ({
  id,
  className,
  children
}) => {
  return (
    <section
      id={id}
      className={cn("w-full", className)}
    >
      {children}
    </section>
  );
};

export default SectionContainer;
