import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider } from 'jotai';
import { initialize } from './shims/microsoft-power-apps-app';

import Layout from './components/pages/_layout';
import { queryClient } from './components/lib/query-client';
import { Toaster } from './components/ui/sonner';
import ErrorBoundary from './components/system/error-boundary';

import { AdminRoute } from './components/admin-route';
import DashboardPage from './components/pages/index';
import CreateTicketPage from './components/pages/create';
import MyTicketsPage from './components/pages/my-tickets';
import AllTicketsPage from './components/pages/all-tickets';
import TicketDetailsPage from './components/pages/ticket-details';
import NotFoundPage from './components/pages/not-found';
import AdminSettingsPage from './components/pages/admin-settings';
import CompaniesPage from './components/pages/companies';
import DepartmentsPage from './components/pages/departments';
import UserManagementPage from './components/pages/user-management';
import RolePermissionsPage from './components/pages/role-permissions';

function App() {
  useEffect(() => {
    initialize();
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary resetQueryCache>
        <JotaiProvider>
          <Toaster richColors />
          <Router>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<DashboardPage />} />
                <Route path="create" element={<CreateTicketPage />} />
                <Route path="my-tickets" element={<MyTicketsPage />} />
                <Route path="all-tickets" element={<AllTicketsPage />} />
                <Route path="ticket/:id" element={<TicketDetailsPage />} />
                <Route path="ticket-details" element={<TicketDetailsPage />} />
                <Route path="ticket-details/:id" element={<TicketDetailsPage />} />
                <Route path="admin-settings" element={<AdminSettingsPage />} />
                <Route path="companies" element={<CompaniesPage />} />
                <Route path="user-management" element={<UserManagementPage />} />
                <Route path="role-permissions" element={<RolePermissionsPage />} />
                <Route path="departments" element={<DepartmentsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </Router>
        </JotaiProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;