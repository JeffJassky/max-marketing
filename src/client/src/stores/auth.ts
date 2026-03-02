import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  memberships: { id: string; accountId: string; role: string }[];
}

export const useAuthStore = defineStore("auth", () => {
  const user = ref<AuthUser | null>(null);
  const loading = ref(false);
  const initialized = ref(false);

  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role === "admin");

  function accountRole(accountId: string): string | null {
    if (!user.value) return null;
    if (user.value.role === "admin") return "admin";
    const m = user.value.memberships.find((m) => m.accountId === accountId);
    return m?.role || null;
  }

  async function checkAuth() {
    try {
      loading.value = true;
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        user.value = await res.json();
      } else {
        user.value = null;
      }
    } catch {
      user.value = null;
    } finally {
      loading.value = false;
      initialized.value = true;
    }
  }

  async function login(
    email: string,
    password: string,
  ): Promise<{ error?: string }> {
    try {
      loading.value = true;
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        // Fetch full user with memberships
        await checkAuth();
        return {};
      } else {
        const data = await res.json();
        return { error: data.error || "Login failed" };
      }
    } catch {
      return { error: "Network error" };
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Continue logout even if request fails
    }
    user.value = null;
  }

  async function forgotPassword(
    email: string,
  ): Promise<{ error?: string; message?: string }> {
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) return { message: data.message };
      return { error: data.error };
    } catch {
      return { error: "Network error" };
    }
  }

  async function resetPassword(
    token: string,
    email: string,
    password: string,
  ): Promise<{ error?: string; message?: string }> {
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });
      const data = await res.json();
      if (res.ok) return { message: data.message };
      return { error: data.error };
    } catch {
      return { error: "Network error" };
    }
  }

  return {
    user,
    loading,
    initialized,
    isAuthenticated,
    isAdmin,
    accountRole,
    checkAuth,
    login,
    logout,
    forgotPassword,
    resetPassword,
  };
});
