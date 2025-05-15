
import React from "react"
import { Toaster as Sonner } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"

type ToasterProps = React.ComponentProps<typeof Sonner>

// Using the props pattern for theming to avoid invalid hook calls
const Toaster = ({ theme = "system", ...props }: ToasterProps & { theme?: string }) => {
  const isMobile = useIsMobile();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group z-[100]"
      position={isMobile ? "top-center" : "bottom-right"}
      closeButton
      richColors
      expand={isMobile}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background/90 group-[.toaster]:backdrop-blur-lg group-[.toaster]:text-foreground group-[.toaster]:border-border/50 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          // Enhanced color scheme to match SIQS badges
          success: "group-[.toaster]:bg-green-500/20 group-[.toaster]:text-green-400 group-[.toaster]:border group-[.toaster]:border-green-500/40",
          error: "group-[.toaster]:bg-red-500/20 group-[.toaster]:text-red-300 group-[.toaster]:border group-[.toaster]:border-red-500/40",
          info: "group-[.toaster]:bg-yellow-500/20 group-[.toaster]:text-yellow-300 group-[.toaster]:border group-[.toaster]:border-yellow-500/40",
          warning: "group-[.toaster]:bg-orange-500/20 group-[.toaster]:text-orange-300 group-[.toaster]:border group-[.toaster]:border-orange-500/40",
        },
        duration: isMobile ? 6000 : 5000, // Longer duration for mobile
        // Custom styling
        style: {
          fontSize: "14px",
          borderRadius: "12px",
          fontWeight: 500,
          paddingBottom: "14px",
          paddingTop: "14px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
