import { auth } from "$lib/stores/auth";
import { alerts } from "$lib/stores/alert";
import type { User } from "$lib/stores/auth";

export interface UserInfo {
  id: string;
  userId: number;
  username: string;
  phone?: string;
  available_balance: number;
  profit_loss: number;
  bank: {
    bank_name: string;
    number: string;
    fullname: string;
    withdrawNumber?: string;
  } | null;
}

export interface InvestmentSummary {
  totalInvested: number;
  totalProfit: number;
  totalEstimatedIncome: number;
  availableBalance: number;
  profitLoss: number;
}

export interface InvestmentHistoryResponse {
  investments: Investment[];
  summary: InvestmentSummary;
}

export interface Investment {
  id: string;
  amount: number;
  duration: number;
  rewardPercentage: number;
  status: "active" | "completed" | "pending" | "cancelled";
  startDate: string;
  endDate: string;
  profit: number;
  estimatedIncome: number;
  autoResubmit: boolean;
  createdAt: string;
}

class UserService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5000; // 5 seconds cache

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.CACHE_DURATION;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getCache(key: string): any | null {
    if (this.isCacheValid(key)) {
      return this.cache.get(key)?.data;
    }
    this.cache.delete(key);
    return null;
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {},
  ): Promise<T | null> {
    const token = this.getToken() || this.getStoredToken();
    if (!token) {
      console.error("No authentication token available");
      return null;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, logout user
          auth.logout();
          alerts.error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${url}:`, error);
      return null;
    }
  }

  async getUserInfo(forceRefresh = false): Promise<UserInfo | null> {
    const cacheKey = "userInfo";

    if (!forceRefresh) {
      const cached = this.getCache(cacheKey);
      if (cached) {
        auth.updateUser(cached);
        return cached;
      }
    }

    auth.setLoading(true);

    try {
      const result = await this.makeRequest<{
        success: boolean;
        data: UserInfo;
      }>("/api/user/info");

      if (result?.success && result.data) {
        this.setCache(cacheKey, result.data);
        auth.updateUser(result.data as any);
        return result.data;
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    } finally {
      auth.setLoading(false);
    }

    return null;
  }

  async getInvestmentHistory(
    forceRefresh = false,
  ): Promise<InvestmentHistoryResponse | null> {
    const cacheKey = "investmentHistory";

    if (!forceRefresh) {
      const cached = this.getCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const result = await this.makeRequest<{
        success: boolean;
        data: InvestmentHistoryResponse;
      }>("/api/investment/history");

      if (result?.success && result.data) {
        this.setCache(cacheKey, result.data);

        // Update user balance from investment summary
        if (result.data.summary) {
          let currentUser: UserInfo | null = null;
          auth.subscribe((state) => {
            currentUser = state.user;
          })();
          if (currentUser) {
            auth.updateUser({
              ...(currentUser as any),
              available_balance: result.data.summary.availableBalance,
              profit_loss: result.data.summary.profitLoss,
            });
          }
        }

        return result.data;
      }
    } catch (error) {
      console.error("Error fetching investment history:", error);
    }

    return null;
  }

  async refreshAllData(): Promise<{
    userInfo: UserInfo | null;
    investmentHistory: Investment[] | null;
  }> {
    const [userInfo, investmentData] = await Promise.all([
      this.getUserInfo(true),
      this.getInvestmentHistory(true),
    ]);

    return {
      userInfo,
      investmentHistory: investmentData?.investments || null,
    };
  }

  // Force logout and clear all caches
  logout(): void {
    this.cache.clear();
    auth.logout();
  }

  // Get current token - this method is needed for the Saving page
  getToken(): string | null {
    let token = null;
    auth.subscribe((state) => {
      token = state.token;
    })();
    return token;
  }

  // Get stored token from localStorage as fallback
  private getStoredToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token");
    }
    return null;
  }

  // Withdrawal methods
  async createWithdrawal(
    amount: number,
    withdrawPassword: string,
  ): Promise<{
    success: boolean;
    message: string;
    data?: {
      amount: number;
      newBalance: number;
      bank: any;
      transactionId: string;
    };
  } | null> {
    const token = this.getToken() || this.getStoredToken();
    if (!token) {
      return { success: false, message: "ไม่พบโทเคนการยืนยันตัวตน" };
    }

    try {
      const response = await fetch("/api/withdraw/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, withdrawPassword }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Create withdrawal error:", error);
      return { success: false, message: "เกิดข้อผิดพลาดในการเชื่อมต่อ" };
    }
  }

  async getWithdrawalHistory(): Promise<{
    success: boolean;
    message: string;
    data?: {
      withdrawals: any[];
      user: any;
    };
  } | null> {
    const token = this.getToken() || this.getStoredToken();
    if (!token) {
      return { success: false, message: "ไม่พบโทเคนการยืนยันตัวตน" };
    }

    try {
      const response = await fetch("/api/withdraw/history", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Get withdrawal history error:", error);
      return { success: false, message: "เกิดข้อผิดพลาดในการเชื่อมต่อ" };
    }
  }

  // Method to get auth store user (for compatibility)
  getUser(): UserInfo | null {
    let user = null;
    auth.subscribe((state) => {
      user = state.user;
    })();
    return user;
  }
}

// Export singleton instance
export const userService = new UserService();

// Export convenience functions
export const getUserInfo = () => userService.getUserInfo();
export const getInvestmentHistory = () => userService.getInvestmentHistory();
export const refreshAllData = () => userService.refreshAllData();
