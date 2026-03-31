import Sidebar from "@/components/shared/sidebar";
import TopNav from "@/components/shared/top-nav";
import BottomNav from "@/components/shared/bottom-nav";
import SessionInitializer from "@/components/shared/session-initializer";
import FeedbackWidget from "@/components/shared/feedback-widget";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex overflow-hidden"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <SessionInitializer />
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">
        <TopNav />
        <main
          className="flex-1 p-4 lg:p-8 pb-28 lg:pb-8 overflow-x-hidden"
          style={{ backgroundColor: "var(--bg)" }}
        >
          {children}
        </main>
        <BottomNav />
      </div>
      <FeedbackWidget />
    </div>
  );
}