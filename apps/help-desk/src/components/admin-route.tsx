import { Navigate } from 'react-router-dom';
import { useUser } from './hooks/use-user';
import { isAdmin } from './lib/admin-config';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { data: user, isLoading } = useUser();
  const userEmail = user?.userPrincipalName;
  const hasAdminAccess = isAdmin(userEmail);

  // Show loading state while checking user
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Redirect non-admin users to My Tickets
  if (!hasAdminAccess) {
    return <Navigate to="/my-tickets" replace />;
  }

  return <>{children}</>;
}
