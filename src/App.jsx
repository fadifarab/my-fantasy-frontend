// client/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard'; // <--- استيراد الملف الجديد
import MyTeam from './pages/MyTeam'; // <--- استيراد
import LeagueStandings from './pages/LeagueStandings';
import Fixtures from './pages/Fixtures';
import MatchDetails from './pages/MatchDetails'; // 🆕
import LeagueManagers from './pages/LeagueManagers';
import LeagueStats from './pages/LeagueStats';
import PlayerStats from './pages/PlayerStats';
import TeamHistory from './pages/TeamHistory';
import AwardsCenter from './pages/AwardsCenter';
import AdminDeadlines from './pages/AdminDeadlines'; // تأكد من صحة المسار
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import TeamsManagement from './pages/TeamsManagement';
import MediaCenter from './pages/MediaCenter';

const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
		  <Route path="/my-team" element={<MyTeam />} />
		  <Route path="/standings" element={<LeagueStandings />} />
		  <Route path="/fixtures" element={<Fixtures />} />
		  <Route path="/match/:fixtureId" element={<MatchDetails />} />
		  <Route path="/managers" element={<LeagueManagers />} />
		  <Route path="/stats" element={<LeagueStats />} />
		  <Route path="/player-stats" element={<PlayerStats />} />
		  <Route path="/team-history/:teamId" element={<TeamHistory />} />
		  <Route path="/awards" element={<AwardsCenter />} />
		  <Route path="/admin/deadlines" element={<AdminDeadlines />} />
		  <Route path="/forgot-password" element={<ForgotPassword />} />
		  <Route path="/reset-password/:token" element={<ResetPassword />} />
		  <Route path="/teams-management" element={<TeamsManagement />} />
		  <Route path="/media-center" element={<MediaCenter />} />
          
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
		  
		  <Route 
			path="/my-team" 
			element={
			  <PrivateRoute>
				<MyTeam />
			  </PrivateRoute>
			} 
		  />

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;