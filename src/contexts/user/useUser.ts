import { createContext, useContext } from "react";
import type { UserProfile } from "../../utils/user";

export interface UserContextType {
  userId: string;
  profile: UserProfile | null;
  refreshProfile: () => void;
  updateProfile: (profile: UserProfile) => void;
}

export const UserContext = createContext<UserContextType | null>(null);

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
