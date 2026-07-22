import Sidebar from "./Sidebar";

export default function AppShell({ children }) {
  return (
    <div className="flex h-screen bg-ink-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}