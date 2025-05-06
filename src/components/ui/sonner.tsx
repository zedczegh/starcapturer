
import React from "react"
import { Toaster as Sonner } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"

type ToasterProps = React.ComponentProps<typeof Sonner>

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
          toast: "group toast group-[.toaster]:bg-cosmic-800/95 group-[.toaster]:border-cosmic-700/50 group-[.toaster]:backdrop-blur-md group-[.toaster]:text-foreground group-[.toaster]:shadow-glow group-[.toaster]:rounded-lg",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:mt-1",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-md",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-md",
          success: "group-[.toaster]:bg-green-900/90 group-[.toaster]:text-green-100 group-[.toaster]:border-green-500/50 group-[.toaster]:border-l-4 group-[.toaster]:border-l-green-500 group-[.toaster]:shadow-lg group-[.toaster]:shadow-green-500/20",
          error: "group-[.toaster]:bg-red-900/90 group-[.toaster]:text-red-100 group-[.toaster]:border-red-500/50 group-[.toaster]:border-l-4 group-[.toaster]:border-l-red-500 group-[.toaster]:shadow-lg group-[.toaster]:shadow-red-500/20",
          info: "group-[.toaster]:bg-blue-900/90 group-[.toaster]:text-blue-100 group-[.toaster]:border-blue-500/50 group-[.toaster]:border-l-4 group-[.toaster]:border-l-blue-500 group-[.toaster]:shadow-lg group-[.toaster]:shadow-blue-500/20",
          warning: "group-[.toaster]:bg-amber-900/90 group-[.toaster]:text-amber-100 group-[.toaster]:border-amber-500/50 group-[.toaster]:border-l-4 group-[.toaster]:border-l-amber-500 group-[.toaster]:shadow-lg group-[.toaster]:shadow-amber-500/20",
        },
        duration: 5000,
        dismissable: true, // Changed from dismissible to dismissable
        style: {
          fontSize: "14px",
          borderRadius: "12px",
          fontWeight: 500,
          paddingBottom: "16px",
          paddingTop: "16px",
          paddingLeft: "18px",
          paddingRight: "16px",
          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.35)",
          border: "1px solid rgba(var(--primary), 0.2)",
          animation: "slideIn 0.3s ease-out forwards"
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
