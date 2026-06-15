import { Navigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext.jsx';
import AuthModal from './AuthModal.jsx';

export default function Register() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh'
        }}
      >
        <div className="spinner" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <AuthModal onClose={() => {}} />
    </div>
  );
}