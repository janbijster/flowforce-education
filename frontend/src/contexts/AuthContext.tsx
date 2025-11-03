import { createContext, useContext, ReactNode } from "react";

export interface Organization {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  organization: Organization;
}

interface AuthContextType {
  user: User | null;
  // Future: login, logout functions will be added here
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Dummy user for now - will be replaced with actual auth later
  const user: User = {
    id: 1,
    username: "demo_user",
    email: "demo@example.com",
    organization: {
      id: 2,
      name: "BHV instituut",
      slug: "bhv-instituut",
      description: "Gespecialiseerd instituut voor Bedrijfshulpverlening (BHV) trainingen en certificeringen.",
    },
  };

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

