import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { realtimeClient, DashboardState } from './services/realtimeClient';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { HubSearchBar } from './components/HubSearchBar';
import { TransformerListTable } from './components/TransformerListTable';
import { GridMapLibre } from './components/GridMapLibre';
import { IncidentsPage } from './pages/IncidentsPage';
import { CrewsPage } from './pages/CrewsPage';
import { CallsPage } from './pages/CallsPage';
import { DiagnosisPage } from './pages/DiagnosisPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { authClient, AuthState } from './services/authClient';
import { ActivePage } from './types';

export const App: React.FC = () => {
  const [state, setState] = useState<DashboardState>(realtimeClient.getState());
  const [authState, setAuthState] = useState<AuthState>(authClient.getState());
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = realtimeClient.subscribe((newState) => {
      setState({ ...newState });
    });
    const unsubAuth = authClient.subscribe((newAuth) => {
      setAuthState({ ...newAuth });
    });
    return () => {
      unsubscribe();
      unsubAuth();
    };
  }, []);

  // Sync current route pathname with activePage
  useEffect(() => {
    const cleanPath = location.pathname.replace(/^\//, '');
    const validPages: ActivePage[] = ['map', 'incidents', 'crews', 'calls', 'diagnosis', 'login', 'signup'];
    if (cleanPath && validPages.includes(cleanPath as ActivePage)) {
      if (state.activePage !== cleanPath) {
        realtimeClient.setActivePage(cleanPath as ActivePage);
      }
    } else if (location.pathname === '/') {
      realtimeClient.setActivePage('map');
    }
  }, [location.pathname]);

  const isDark = state.theme === 'dark';

  return (
    <Routes>
      {/* 1. Dedicated Full-Screen Login Route */}
      <Route
        path="/login"
        element={
          <LoginPage
            theme={state.theme}
            onNavigateSignup={() => {
              realtimeClient.setActivePage('signup');
              navigate('/signup');
            }}
            onNavigateMap={() => {
              realtimeClient.setActivePage('map');
              navigate('/map');
            }}
          />
        }
      />

      {/* 2. Dedicated Full-Screen Signup Route */}
      <Route
        path="/signup"
        element={
          <SignupPage
            theme={state.theme}
            onNavigateLogin={() => {
              realtimeClient.setActivePage('login');
              navigate('/login');
            }}
            onNavigateMap={() => {
              realtimeClient.setActivePage('map');
              navigate('/map');
            }}
          />
        }
      />

      {/* 3. Authenticated Dashboard Layout & Routes */}
      <Route
        path="/*"
        element={
          !authState.isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : (
            <div
              className={`h-screen flex font-sans transition-colors duration-200 selection:bg-cyan-500/30 selection:text-cyan-200 overflow-hidden ${
                isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
              }`}
            >
              {/* Left Navigation Sidebar */}
              <Sidebar
                activePage={state.activePage}
                theme={state.theme}
                callStatus={state.callStatus}
                ticketCount={state.ticketsList.filter((t) => t.status === 'OPEN').length}
                availableCrewsCount={state.crews.filter((c) => c.status === 'AVAILABLE').length}
                isOpen={isSidebarOpen}
                onPageChange={(page) => realtimeClient.setActivePage(page)}
                onToggleTheme={() => realtimeClient.toggleTheme()}
                onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
              />

              {/* Main Content Canvas */}
              <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <Header state={state} onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />

                <main className="flex-1 overflow-y-auto min-h-0 p-4 w-full mx-auto flex flex-col gap-4">
                  <Routes>
                    {/* Grid Map & Hubs */}
                    <Route
                      path="map"
                      element={
                        <div className="flex flex-col gap-4 animate-fade-in flex-1">
                          <HubSearchBar
                            theme={state.theme}
                            hubs={state.hubs}
                            activeHub={state.activeHub}
                            searchQuery={state.searchQuery}
                            onSearchChange={(q) => realtimeClient.setSearchQuery(q)}
                            onSelectHub={(hubId) => realtimeClient.selectHub(hubId)}
                          />
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-stretch">
                            <div className="lg:col-span-7 flex flex-col h-full">
                              <GridMapLibre
                                theme={state.theme}
                                assets={state.assets}
                                endUsers={state.endUsers}
                                selectedAsset={state.selectedAsset}
                                selectedEndUser={state.selectedEndUser}
                                focusedCoordinates={state.focusedCoordinates}
                                isFullscreen={state.isMapFullscreen}
                                onToggleFullscreen={() => realtimeClient.toggleMapFullscreen()}
                                onSelectAsset={(asset) => realtimeClient.selectAsset(asset)}
                                onSelectEndUser={(user) => realtimeClient.selectEndUser(user)}
                              />
                            </div>
                            <div className="lg:col-span-5 flex flex-col h-full">
                              <TransformerListTable
                                theme={state.theme}
                                hub={state.activeHub}
                                assets={state.assets}
                                selectedAsset={state.selectedAsset}
                                onSelectTransformer={(tr) => realtimeClient.selectAsset(tr)}
                              />
                            </div>
                          </div>
                        </div>
                      }
                    />

                    {/* Incidents Management */}
                    <Route
                      path="incidents"
                      element={
                        <IncidentsPage
                          theme={state.theme}
                          tickets={state.ticketsList}
                          auditLogs={state.auditLogs}
                          activeTicket={state.activeTicket}
                        />
                      }
                    />

                    {/* Field Crews & Dispatch */}
                    <Route
                      path="crews"
                      element={
                        <CrewsPage
                          theme={state.theme}
                          crews={state.crews}
                          tickets={state.ticketsList}
                          activeTicketNumber={state.activeTicket?.ticketNumber}
                        />
                      }
                    />

                    {/* Telephony & Live Calls */}
                    <Route
                      path="calls"
                      element={
                        <CallsPage
                          theme={state.theme}
                          callStatus={state.callStatus}
                          duration={state.callDuration}
                          callerNumber={state.currentScenario.callerNumber}
                          locality={state.currentScenario.locality}
                          transcripts={state.transcripts}
                        />
                      }
                    />

                    {/* Gemini AI Diagnosis */}
                    <Route
                      path="diagnosis"
                      element={
                        <DiagnosisPage
                          theme={state.theme}
                          diagnosis={state.activeIncidentDiagnosis}
                        />
                      }
                    />

                    {/* Default route inside dashboard -> /map */}
                    <Route path="" element={<Navigate to="map" replace />} />
                    <Route path="*" element={<Navigate to="map" replace />} />
                  </Routes>
                </main>

                <footer
                  className={`py-3 text-center text-xs border-t transition-colors shrink-0 ${
                    isDark ? 'border-slate-900 bg-slate-950 text-slate-500' : 'border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  TSSPDCL Hyderabad Operations Center &copy; {new Date().getFullYear()} — Cybercity &amp; Hyderabad Metro GridResQ MVP
                </footer>
              </div>
            </div>
          )
        }
      />
    </Routes>
  );
};

export default App;
