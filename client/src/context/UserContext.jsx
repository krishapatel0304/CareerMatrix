import { createContext, useState } from "react";
import {
  getStoredUser,
  logout as clearAuth,
} from "../services/authService";

export const UserContext = createContext();

function UserProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());

  const loginUser = (userData) => {
    setUser(userData);
  };

  const logoutUser = () => {
    clearAuth();
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, setUser, loginUser, logoutUser }}>
      {children}
    </UserContext.Provider>
  );
}

export default UserProvider;
