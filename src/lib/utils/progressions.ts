import type { ProgressionStatus } from "@/types";

export const progressionStatusLabels: Record<ProgressionStatus, string> = {
  active: "Active",
  won: "Completed",
  lost: "Lost",
  abandoned: "Abandoned",
};

// Finished-and-won reads strongest; the rest stay quiet.
export const progressionStatusClass = (status: ProgressionStatus) =>
  status === "won" ? "text-gray-900" : "text-gray-500";
