import React, { useEffect, useState, useCallback } from "react";
import { UserContext } from "./useUser";
import {
  getOrCreateUserId,
  getUserProfile,
  saveUserProfile,
  type UserProfile,
} from "../../utils/user";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string>("");
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const refreshProfile = useCallback(() => {
    const id = getOrCreateUserId();
    setUserId(id);
    const userProfile = getUserProfile(id);
    setProfile(userProfile);
  }, []);

  const updateProfile = useCallback((newProfile: UserProfile) => {
    saveUserProfile(newProfile);
    setProfile(newProfile);
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  return (
    <UserContext.Provider
      value={{
        userId,
        profile,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
