export interface InvestmentPlan {
  duration: number;
  label: string;
  rewardPercentage: number;
}

export const INVESTMENT_PLANS: InvestmentPlan[] = [
  { duration: 1, label: "1D", rewardPercentage: 0.1 },
  { duration: 7, label: "7D", rewardPercentage: 1 },
  { duration: 15, label: "15D", rewardPercentage: 2.5 },
  { duration: 30, label: "30D", rewardPercentage: 4.5 },
  { duration: 60, label: "60D", rewardPercentage: 10 },
  { duration: 90, label: "90D", rewardPercentage: 19.5 },
];

export function getRewardPercentage(duration: number): number {
  const plan = INVESTMENT_PLANS.find((p) => p.duration === duration);
  return plan ? plan.rewardPercentage : 0;
}

export function calculateProfit(amount: number, percentage: number): number {
  return (amount * percentage) / 100;
}

export function calculateCurrentProfit(
  startDate: Date,
  endDate: Date,
  estimatedIncome: number,
  status: string,
): number {
  const now = new Date();

  if (status === "completed") {
    return estimatedIncome;
  }

  if (status === "cancelled") {
    return 0;
  }

  if (status === "active" && now >= endDate) {
    return estimatedIncome;
  }

  if (status === "active") {
    const elapsedMs = now.getTime() - startDate.getTime();
    const totalMs = endDate.getTime() - startDate.getTime();
    const progress = Math.min(elapsedMs / totalMs, 1);
    return estimatedIncome * progress;
  }

  return 0;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string | null | undefined): string {
  // Handle null/undefined dates
  if (!date) {
    return "ไม่ระบุวันที่";
  }

  // Handle string dates from API
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    console.warn("Invalid date value:", date);
    return "ไม่ระบุวันที่";
  }

  try {
    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(dateObj);
  } catch (error) {
    console.error("Error formatting date:", error, "for date:", date);
    return "ไม่ระบุวันที่";
  }
}

export function getInvestmentStatus(
  startDate: Date,
  endDate: Date,
): "active" | "completed" | "cancelled" {
  const now = new Date();

  if (now >= endDate) {
    return "completed";
  }

  return "active";
}

// Server-side only functions - these should not be imported by client components
export async function processCompletedInvestments(): Promise<void> {
  // This function should only be called from server-side API routes
  // Move this implementation to a server-only file if needed
  throw new Error("This function can only be called from server-side");
}

export async function getUserInvestmentSummary(userId: number): Promise<{
  totalInvested: number;
  activeInvestments: number;
  totalProfit: number;
  totalEstimatedIncome: number;
}> {
  // This function should only be called from server-side API routes
  // Move this implementation to a server-only file if needed
  throw new Error("This function can only be called from server-side");
}
