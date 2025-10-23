import { writable } from "svelte/store";
import { browser } from "$app/environment";
import { decodeToken, isTokenExpired } from "$lib/utils/jwt";

export interface User {
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

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
  });

  return {
    subscribe,

    // Initialize auth state from localStorage
    init: () => {
      if (browser) {
        const storedToken = localStorage.getItem("auth_token");

        if (storedToken) {
          // Validate stored token before using it
          try {
            // Check if token is expired
            if (!isTokenExpired(storedToken)) {
              const decoded = decodeToken(storedToken);
              if (decoded) {
                update((state) => ({
                  ...state,
                  token: storedToken,
                  isAuthenticated: true,
                }));
              } else {
                // Token is invalid, remove it
                localStorage.removeItem("auth_token");
              }
            } else {
              // Token is expired, remove it
              localStorage.removeItem("auth_token");
            }
          } catch (error) {
            console.error("Token validation error:", error);
            // Remove invalid token
            localStorage.removeItem("auth_token");
          }
        }
      }
    },

    // Login action
    login: (token: string, user: User) => {
      const authState = {
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      };

      set(authState);

      // Store token in localStorage for persistence
      if (browser) {
        localStorage.setItem("auth_token", token);
      }
    },

    // Logout action
    logout: () => {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });

      if (browser) {
        localStorage.removeItem("auth_token");
      }
    },

    // Update user data from API response
    updateUser: (userData: User) => {
      update((state) => ({
        ...state,
        user: userData,
      }));
    },

    // Set loading state
    setLoading: (loading: boolean) => {
      update((state) => ({
        ...state,
        isLoading: loading,
      }));
    },

    // Get current token
    getToken: () => {
      let currentToken = null;
      subscribe((state) => {
        currentToken = state.token;
      })();
      return currentToken;
    },

    // Force refresh user data from API
    async refreshUserData() {
      const token = this.getToken();
      if (!token) return null;

      try {
        const response = await fetch("/api/user/info", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.updateUser(result.data);
            return result.data;
          } else if (response.status === 401) {
            // Token invalid, logout
            this.logout();
          }
        } else if (response.status === 401) {
          // Token invalid, logout
          this.logout();
        }
      } catch (error) {
        console.error("Error refreshing user data:", error);
      }

      return null;
    },

    // Get current user data from store
    getUser() {
      let currentUser = null;
      this.subscribe((state) => {
        currentUser = state.user;
      })();
      return currentUser;
    },
  };
}

export const auth = createAuthStore();
