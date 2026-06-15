import { Navigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext.jsx';
import AuthModal from './AuthModal.jsx';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
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
      <div>
  <AuthModal onClose={() => {}} />

  <div style={{ marginTop: '20px', textAlign: 'center' }}>
    <GoogleLogin
      onSuccess={(credentialResponse) => {
        console.log(credentialResponse);
      }}
      onError={() => {
        console.log('Google Login Failed');
      }}
    />
  </div>
</div>
    </div>
  );
}