import { createFileRoute } from "@tanstack/react-router";
import { getRuntimeHealth } from "@/lib/runtime-health";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const status = getRuntimeHealth();
        return Response.json(status);
      },
    },
  },
});
