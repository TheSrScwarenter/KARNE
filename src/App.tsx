/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { StudentDashboard } from './pages/StudentDashboard';
import { CoachDashboard } from './pages/CoachDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { WrongQuestions } from './pages/WrongQuestions';
import { StudyLog } from './pages/StudyLog';
import { Exams } from './pages/Exams';
import { ProgramAdvisor } from './pages/ProgramAdvisor';
import { StudentsManagement } from './pages/StudentsManagement';
import { CoachNotes } from './pages/CoachNotes';
import { BooksManagement } from './pages/BooksManagement';
import { FocusRoom } from './pages/FocusRoom';
import { Settings } from './pages/Settings';
import { UserProfileView } from './pages/UserProfile';
import { CoachingHub } from './pages/CoachingHub';
import { AiAnalyticsView } from './pages/AiAnalyticsView';

const MainRouter: React.FC = () => {
  const { user, currentPath, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md border border-black/[0.08] mb-3 animate-pulse">
          <img src="/logo.jpg" alt="Karne" className="w-full h-full object-cover" />
        </div>
        <p className="mt-2 text-xs font-semibold text-[#86868B] tracking-wide">
          Karne YKS v2.0
        </p>
      </div>
    );
  }

  // Public Unauthenticated Pages
  if (!user) {
    if (currentPath === '/signup') {
      return <Signup />;
    }
    return <Login />;
  }

  // Authenticated App Shell with Sidebar, Header, and Mobile Navigation
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex text-[#1D1D1F] relative font-sans">
      {/* Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        <Header />
        <main className="flex-1 pb-24 md:pb-12 px-3.5 sm:px-6 md:px-8 pt-4 sm:pt-6 max-w-7xl w-full mx-auto">
          {(() => {
            // Admin routing
            if (user.role === 'admin') {
              switch (currentPath) {
                case '/settings':
                  return <Settings />;
                case '/admin':
                case '/dashboard':
                default:
                  return <AdminDashboard />;
              }
            }

            // Coach & Student routing
            switch (currentPath) {
              case '/dashboard':
              case '/':
                return user.role === 'coach' ? <CoachDashboard /> : <StudentDashboard />;
              case '/wrong-questions':
                return <WrongQuestions />;
              case '/focus':
              case '/timer':
                return <FocusRoom />;
              case '/study-log':
                return <StudyLog />;
              case '/exams':
                return <Exams />;
              case '/books':
              case '/resources':
                return <BooksManagement />;
              case '/program':
              case '/program/history':
              case '/program-advisor':
                return <ProgramAdvisor />;
              case '/students':
                return <StudentsManagement />;
              case '/coach-notes':
                return <CoachNotes />;
              case '/coaching':
              case '/messages':
              case '/appointments':
              case '/tasks':
                return <CoachingHub />;
              case '/ai-analytics':
              case '/rank-predictor':
              case '/weak-topics':
                return <AiAnalyticsView />;
              case '/profile':
              case '/badges':
                return <UserProfileView />;
              case '/settings':
                return <Settings />;
              default:
                return user.role === 'coach' ? <CoachDashboard /> : <StudentDashboard />;
            }
          })()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (for small screens < md) */}
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}
