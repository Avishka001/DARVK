import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import * as api from '../api';

interface UserContextType {
  isUserLoggedIn: boolean;
  currentUser: api.User | null;
  loginUser: (data: any) => Promise<boolean>;
  signupUser: (data: any) => Promise<boolean>;
  googleLogin: (data: any) => Promise<boolean>;
  logoutUser: () => void;
  isAdmin: boolean;
}

const UserContext = createContext<UserContextType>({
  isUserLoggedIn: false,
  currentUser: null,
  loginUser: async () => false,
  signupUser: async () => false,
  googleLogin: async () => false,
  logoutUser: () => {},
  isAdmin: false,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(() => api.hasUserToken());
  const [currentUser, setCurrentUser] = useState<api.User | null>(null);
  
  const isAdmin = currentUser?.role === 1;

  useEffect(() => {
    // If we have a token, we could optionally fetch the current user's profile on load.
    // For now, if we have a token but no user object, we rely on the user object returned at login.
    const storedUser = localStorage.getItem('aura_current_user');
    if (storedUser && api.hasUserToken()) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        // invalid JSON
      }
    }
  }, []);

  const persistUser = (user: api.User) => {
    setCurrentUser(user);
    localStorage.setItem('aura_current_user', JSON.stringify(user));
  };

  const loginUser = async (data: any) => {
    try {
      const res = await api.userLogin(data);
      api.setUserToken(res.token);
      persistUser(res.user);
      setIsUserLoggedIn(true);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const signupUser = async (data: any) => {
    try {
      const res = await api.userSignup(data);
      api.setUserToken(res.token);
      persistUser(res.user);
      setIsUserLoggedIn(true);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const googleLogin = async (data: any) => {
    try {
      const res = await api.googleLogin(data);
      api.setUserToken(res.token);
      persistUser(res.user);
      setIsUserLoggedIn(true);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const logoutUser = () => {
    api.clearUserToken();
    localStorage.removeItem('aura_current_user');
    setCurrentUser(null);
    setIsUserLoggedIn(false);
  };

  return (
    <UserContext.Provider value={{ isUserLoggedIn, currentUser, loginUser, signupUser, googleLogin, logoutUser, isAdmin }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
