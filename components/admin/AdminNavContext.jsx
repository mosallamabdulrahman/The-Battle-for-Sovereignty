"use client";

import { createContext, useContext, useState } from "react";

export const AdminNavContext = createContext({
  mobileOpen: false,
  setMobileOpen: () => {},
  toggleMobileOpen: () => {},
});

export function AdminNavProvider({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleMobileOpen = () => setMobileOpen((prev) => !prev);

  return (
    <AdminNavContext.Provider
      value={{ mobileOpen, setMobileOpen, toggleMobileOpen }}
    >
      {children}
    </AdminNavContext.Provider>
  );
}

export const useAdminNav = () => useContext(AdminNavContext);
