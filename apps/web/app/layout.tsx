import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { Toaster } from "@workspace/ui/components/sonner"
import { cn } from "@workspace/ui/lib/utils"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={
        {
          "--font-sans":
            '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
          "--font-mono":
            '"Geist Mono", "SFMono-Regular", "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
        } as React.CSSProperties
      }
      className={cn(
        "antialiased",
        "font-sans"
      )}
    >
      <body>
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
