
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
          toast: "group toast group-[.toaster]:bg-cosmic-800/95 group-[.toaster]:border-cosmic-700/50 group-[.toaster]:backdrop-blur-md group-[.toaster]:text-foreground group-[.toaster]:shadow-glow",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:bg-green-900/90 group-[.toaster]:text-green-100 group-[.toaster]:border-green-500/30",
          error: "group-[.toaster]:bg-red-900/90 group-[.toaster]:text-red-100 group-[.toaster]:border-red-500/30",
          info: "group-[.toaster]:bg-blue-900/90 group-[.toaster]:text-blue-100 group-[.toaster]:border-blue-500/30",
          warning: "group-[.toaster]:bg-amber-900/90 group-[.toaster]:text-amber-100 group-[.toaster]:border-amber-500/30",
        },
        duration: 5000,
        style: {
          fontSize: "14px",
          borderRadius: "12px",
          fontWeight: 500,
          paddingBottom: "16px",
          paddingTop: "16px",
          paddingLeft: "16px",
          paddingRight: "16px",
          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.25)",
          border: "1px solid rgba(var(--primary), 0.2)",
          animation: "slideIn 0.3s ease-out forwards"
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
