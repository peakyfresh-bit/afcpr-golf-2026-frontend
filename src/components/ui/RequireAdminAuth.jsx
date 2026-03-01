import { Navigate } from "react-router-dom";

export default function RequireAdminAuth({ children }) {
  const token = localStorage.getItem("afcpr_admin_token");

  if (!token) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}