import React, { useState, useCallback } from "react";
import { UserContext } from "./useUser";
import {
  getOrCreateUserId,
  getUserProfile,
  saveUserProfile,
  type UserProfile,
} from "../../utils/user";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string>(() => getOrCreateUserId());
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const id = getOrCreateUserId();
    return id ? getUserProfile(id) : null;
  });

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
