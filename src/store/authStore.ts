import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  user_code: string;
  email: string;
  full_name: string;
  role: 'owner' | 'admin' | 'staff' | 'view_only' | 'branch_manager' | 'cashier';
  mobile?: string;
  address?: string;
  branch_id?: string;
  branch_name?: string;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: import.meta.env.DEV ? {
        id: 'dev-1',
        user_code: 'DEV001',
        email: 'dev@gvc.local',
        full_name: 'Owner Admin',
        role: 'owner',
      } as User : null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
    }),
    {
      name: 'gvc-auth-storage',
    }
  )
);
