import React from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
      </div>
    );
  }
  if (!user || user.role !== "admin") return <Navigate to="/admin/login" replace />;
  return children;
}
