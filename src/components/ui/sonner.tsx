
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const isMobile = useIsMobile()

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
          success: "group-[.toaster]:bg-green-100/90 group-[.toaster]:text-green-900 dark:group-[.toaster]:bg-green-900/90 dark:group-[.toaster]:text-green-100",
          error: "group-[.toaster]:bg-red-100/90 group-[.toaster]:text-red-900 dark:group-[.toaster]:bg-red-900/90 dark:group-[.toaster]:text-red-100",
          info: "group-[.toaster]:bg-blue-100/90 group-[.toaster]:text-blue-900 dark:group-[.toaster]:bg-blue-900/90 dark:group-[.toaster]:text-blue-100",
        },
        duration: 5000, // Longer default duration for better readability
        // Custom styling
        style: {
          fontSize: "14px",
          borderRadius: "12px",
          fontWeight: 500,
          paddingBottom: "14px",
          paddingTop: "14px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
