import { useContext } from "react";
import { UserContext } from "../context/UserContext";

export function useAuth() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useAuth must be used within UserProvider");
  }

  return context;
}

export default useAuth;
