import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { EventProvider } from './context/EventContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppLayout } from './layouts/AppLayout';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { EventDashboardPage } from './pages/EventDashboardPage';
import { TasksPage } from './pages/TasksPage';
import { VolunteersPage } from './pages/VolunteersPage';
import { MeetingsPage } from './pages/MeetingsPage';
import { RisksPage } from './pages/RisksPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { ActivityLogPage } from './pages/ActivityLogPage';

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <EventProvider>
          <NotificationProvider>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Operations Routes */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<EventDashboardPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/volunteers" element={<VolunteersPage />} />
                <Route path="/meetings" element={<MeetingsPage />} />
                <Route path="/risks" element={<RisksPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/activity" element={<ActivityLogPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
          </NotificationProvider>
        </EventProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
