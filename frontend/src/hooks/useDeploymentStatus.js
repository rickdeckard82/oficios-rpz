import { useQuery } from "@tanstack/react-query";
import { getDeployment } from "../api/deployments.js";

export function useDeploymentStatus(deploymentId) {
  return useQuery({
    queryKey: ["deployment", deploymentId],
    queryFn: () => getDeployment(deploymentId),
    enabled: Boolean(deploymentId),
    refetchInterval: (query) => (query.state.data?.status === "running" ? 2000 : false),
  });
}
