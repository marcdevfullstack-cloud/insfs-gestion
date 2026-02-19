"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types";
import { getUser, clearAuth, isAuthenticated } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logout: () => {},
  setUser: () => {},
});

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      setUser(getUser());
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    clearAuth();
    setUser(null);
    router.push("/login");
  };

  return { user, isLoading, logout, setUser };
}

export function useAuth() {
  return useContext(AuthContext);
}