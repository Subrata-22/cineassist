import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext.jsx';
import { useState, useRef } from 'react';

// Layout
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';

// Pages
import HomePage from './components/layout/HomePage.jsx';
import Dashboard from './components/dashboard/Dashboard.jsx';
import Explore from './components/social/Explore.jsx';
import UserProfile from './components/social/UserProfile.jsx';
import FollowList from './components/social/FollowList.jsx';
import EditProfile from './components/social/EditProfile.jsx';
import Challenges from './components/social/Challenges.jsx';
import AnalysisDetail from './components/analyzer/AnalysisDetail.jsx';
import Compare from './components/pro/Compare.jsx';
import Storyboard from './components/pro/Storyboard.jsx';
import Notifications from './components/notifications/Notifications.jsx';
import CreateChallenge from './components/admin/CreateChallenge';
import AdminChallenges from './components/admin/AdminChallenges';
import EditChallenge from './components/admin/EditChallenge';
import AdminAnalytics from './components/admin/AdminAnalytics';
import AuthModal from './components/auth/AuthModal.jsx';
import Login from './components/auth/Login.jsx';
import Register from './components/auth/Register.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><div className="spinner"/></div>;
 if (!user) {
  return <Navigate to="/login" replace />;
}
  return children;
}

function Layout({ showAuth, setShowAuth, fileInputRef }) {
  const location = useLocation();

  const hideLayout =
    location.pathname === '/login' ||
    location.pathname === '/register';

  return (
    <>
      {!hideLayout && (
        <Navbar
          onAuthClick={() => setShowAuth(true)}
          fileInputRef={fileInputRef}
        />
      )}

      <Routes>
         <Route
    path="/"
    element={
      <HomePage
        onAuthClick={() => setShowAuth(true)}
        fileInputRef={fileInputRef}
      />
    }
  />

  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />

  <Route path="/explore" element={<Explore />} />
  <Route path="/challenges" element={<Challenges />} />
  <Route path="/analysis/:id" element={<AnalysisDetail />} />

  <Route
    path="/user/:username"
    element={<UserProfile />}
  />

  <Route
    path="/user/:username/:type"
    element={<FollowList />}
  />

  <Route
    path="/dashboard"
    element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    }
  />

  <Route
    path="/admin/challenges/create"
    element={
      <ProtectedRoute>
        <CreateChallenge />
      </ProtectedRoute>
    }
  />

  <Route
    path="/admin/challenges"
    element={
      <ProtectedRoute>
        <AdminChallenges />
      </ProtectedRoute>
    }
  />

  <Route
    path="/admin/analytics"
    element={
      <ProtectedRoute>
        <AdminAnalytics />
      </ProtectedRoute>
    }
  />

  <Route
    path="/admin/challenges/edit/:id"
    element={
      <ProtectedRoute>
        <EditChallenge />
      </ProtectedRoute>
    }
  />

  <Route
    path="/settings"
    element={
      <ProtectedRoute>
        <EditProfile />
      </ProtectedRoute>
    }
  />

  <Route
    path="/notifications"
    element={
      <ProtectedRoute>
        <Notifications />
      </ProtectedRoute>
    }
  />

  <Route
    path="/compare"
    element={
      <ProtectedRoute>
        <Compare />
      </ProtectedRoute>
    }
  />

  <Route
    path="/storyboard"
    element={
      <ProtectedRoute>
        <Storyboard />
      </ProtectedRoute>
    }
  />

  <Route
    path="*"
    element={<Navigate to="/" replace />}
  />
        
      </Routes>

      {!hideLayout && <Footer />}
    </>
  );
}

function AppInner() {
  const [showAuth, setShowAuth] = useState(false);
  const fileInputRef = useRef(null);

  return (
    <BrowserRouter>
      <Layout
  showAuth={showAuth}
  setShowAuth={setShowAuth}
  fileInputRef={fileInputRef}
/>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner/>
    </AuthProvider>
  );
}
