import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* App Navbar */}
        <Navbar variant="app" />

        {/* Page Content with Scroll */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
            <Breadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
