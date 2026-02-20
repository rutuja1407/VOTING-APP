import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner'; // Keep this if you wish to use toast notifications

// 1. Create the context
const UserContext = createContext();

// 2. Create the provider component
export function UserProvider({ children }) {
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch user vote status
  const fetchUser = useCallback(async () => {
    const aadhaar = localStorage.getItem('aadhaar');
    if (!aadhaar) {
      setUser({});
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8000/api/auth/aadhaar/${aadhaar}`);
      const data = await res.json();
      console.log('data',data);
      
      if (res.status === 200) {
        setUser(data.user || {});
      } else {
        setUser({});
        toast.error(data.error || "Failed to fetch voting status");
      }
    } catch (error) {
      setUser({});
      toast.error("Failed to fetch voting status");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // 3. Provide the state and the updater function
  return (
    <UserContext.Provider value={{ user, setUser, fetchUser, loading }}>
      {children}
    </UserContext.Provider>
  );
}

// 4. Custom hook for getting the User Context (for easy use in components)
export function useUser() {
  return useContext(UserContext);
}
