import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider, useCurrentUser } from '@/store';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import TaskList from '@/pages/TaskList';
import Statistics from '@/pages/Statistics';
import Settings from '@/pages/Settings';
import Accounts from '@/pages/Accounts';
import MainLayout from '@/components/layout/MainLayout';

function AppRoutes() {
  const { user } = useCurrentUser();

  if (!user) {
    return (
      <>
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
        <Toaster />
      </>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tasks" element={<TaskList />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="settings" element={<Settings />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
}
