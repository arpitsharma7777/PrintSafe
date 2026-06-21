import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

interface SocketContextType {
  socket: Socket | null;
  status: ConnectionStatus;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  status: "disconnected",
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || "http://localhost:5000";
    const socketInstance = io(wsUrl, {
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(socketInstance);

    const handleConnect = () => setStatus("connected");
    const handleDisconnect = () => setStatus("disconnected");
    const handleReconnectAttempt = () => setStatus("reconnecting");

    socketInstance.on("connect", handleConnect);
    socketInstance.on("disconnect", handleDisconnect);
    socketInstance.io.on("reconnect_attempt", handleReconnectAttempt);
    socketInstance.io.on("reconnect_error", handleDisconnect);
    socketInstance.io.on("reconnect_failed", handleDisconnect);

    // Initial check
    if (socketInstance.connected) {
      setStatus("connected");
    }

    return () => {
      socketInstance.off("connect", handleConnect);
      socketInstance.off("disconnect", handleDisconnect);
      socketInstance.io.off("reconnect_attempt", handleReconnectAttempt);
      socketInstance.io.off("reconnect_error", handleDisconnect);
      socketInstance.io.off("reconnect_failed", handleDisconnect);
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, status }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
