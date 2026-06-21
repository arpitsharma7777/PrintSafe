import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SocketProvider, useSocket } from "./sockets/SocketProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function DashboardContent() {
  const { status } = useSocket();

  const statusColors = {
    connected: "bg-emerald-500 text-emerald-950 border-emerald-600",
    reconnecting: "bg-amber-500 text-amber-950 border-amber-600 animate-pulse",
    disconnected: "bg-rose-500 text-rose-950 border-rose-600",
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <header className="border-b bg-white dark:bg-slate-900 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">PrintSafe Operator</h1>
        
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[status]}`}>
            {status.toUpperCase()}
          </span>
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col items-center justify-center text-center">
        <div className="max-w-md bg-white dark:bg-slate-900 border rounded-xl p-8 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Foundation Configured</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            React, Vite, TailwindCSS, Axios, TanStack Query, Zustand, and Socket.IO are successfully initialized.
          </p>
          <div className="text-xs text-left bg-slate-50 dark:bg-slate-950 border rounded p-4 font-mono space-y-1">
            <div>✅ tailwind.config.js</div>
            <div>✅ postcss.config.js</div>
            <div>✅ components.json (Shadcn)</div>
            <div>✅ apiClient.ts (Axios)</div>
            <div>✅ SocketProvider.tsx</div>
            <div>✅ uiStore.ts (Zustand)</div>
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <DashboardContent />
      </SocketProvider>
    </QueryClientProvider>
  );
}

export default App;
