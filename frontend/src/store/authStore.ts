import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  user_code: string;
  email: string;
  full_name: string;
  role: 'owner' | 'admin' | 'staff' | 'view_only';
  mobile?: string;
  address?: string;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: (user, token) => set({ user, accessToken: token }),
      logout: () => set({ user: null, accessToken: null }),
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
