import { useParams, Navigate } from "react-router-dom";

/**
 * Redirect component for old /services/:id routes to /guides/:id
 */
export default function ServicesRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/guides/${id}`} replace />;
}
