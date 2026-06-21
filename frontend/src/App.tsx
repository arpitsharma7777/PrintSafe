import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SocketProvider } from "./sockets/SocketProvider";
import { QueuePage } from "./pages/QueuePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <QueuePage />
      </SocketProvider>
    </QueryClientProvider>
  );
}

export default App;
