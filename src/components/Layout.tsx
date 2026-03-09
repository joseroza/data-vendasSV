import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { ThemeToggle } from "@/context/ThemeContext.tsx";

export function Layout() {
  return (
    <SidebarProvider>
      <div
        style={{ width: "100vw", minHeight: "100vh", display: "flex", overflow: "hidden" }}
        className="bg-background"
      >
        <AppSidebar />

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <header
            style={{ position: "sticky", top: 0, zIndex: 10 }}
            className="h-14 flex items-center justify-between border-b border-border px-5 bg-card/60 backdrop-blur-md"
          >
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
            <ThemeToggle />
          </header>

          <main
            style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}
            className="p-6 lg:p-8"
          >
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}