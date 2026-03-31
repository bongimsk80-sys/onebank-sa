import { create } from "zustand";

type Role =
  | "admin"
  | "approver"
  | "initiator"
  | "reviewer"
  | "executor"
  | "viewer";

interface SessionStore {
  role: Role | null;
  name: string | null;
  email: string | null;
  setSession: (role: Role, name: string, email: string) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  role: null,
  name: null,
  email: null,
  setSession: (role, name, email) => set({ role, name, email }),
  clearSession: () => set({ role: null, name: null, email: null }),
}));

// Role permissions
export const rolePermissions: Record<Role, {
  canInitiatePayments: boolean;
  canReviewPayments: boolean;
  canApprovePayments: boolean;
  canExecutePayments: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canManageBeneficiaries: boolean;
}> = {
  admin: {
    canInitiatePayments: true,
    canReviewPayments: true,
    canApprovePayments: true,
    canExecutePayments: true,
    canManageUsers: true,
    canViewAnalytics: true,
    canManageBeneficiaries: true,
  },
  initiator: {
    canInitiatePayments: true,
    canReviewPayments: false,
    canApprovePayments: false,
    canExecutePayments: false,
    canManageUsers: false,
    canViewAnalytics: false,
    canManageBeneficiaries: true,
  },
  reviewer: {
    canInitiatePayments: false,
    canReviewPayments: true,
    canApprovePayments: false,
    canExecutePayments: false,
    canManageUsers: false,
    canViewAnalytics: true,
    canManageBeneficiaries: false,
  },
  approver: {
    canInitiatePayments: false,
    canReviewPayments: false,
    canApprovePayments: true,
    canExecutePayments: false,
    canManageUsers: false,
    canViewAnalytics: true,
    canManageBeneficiaries: false,
  },
  executor: {
    canInitiatePayments: false,
    canReviewPayments: false,
    canApprovePayments: false,
    canExecutePayments: true,
    canManageUsers: false,
    canViewAnalytics: false,
    canManageBeneficiaries: false,
  },
  viewer: {
    canInitiatePayments: false,
    canReviewPayments: false,
    canApprovePayments: false,
    canExecutePayments: false,
    canManageUsers: false,
    canViewAnalytics: true,
    canManageBeneficiaries: false,
  },
};