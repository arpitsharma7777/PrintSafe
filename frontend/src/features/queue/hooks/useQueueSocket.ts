import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "../../../sockets/SocketProvider";

export const useQueueSocket = () => {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const invalidateQueue = () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    };

    socket.on("job:created", invalidateQueue);
    socket.on("job:printed", invalidateQueue);
    socket.on("job:deleted", invalidateQueue);

    return () => {
      socket.off("job:created", invalidateQueue);
      socket.off("job:printed", invalidateQueue);
      socket.off("job:deleted", invalidateQueue);
    };
  }, [socket, queryClient]);
};
