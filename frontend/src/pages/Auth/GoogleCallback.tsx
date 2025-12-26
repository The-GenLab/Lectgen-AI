import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GoogleCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Simply redirect to login with success parameter
    // The Login component will handle the auth flow
    navigate('/login?success=true');
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#f6f7f8',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #e5e7eb',
        borderTopColor: '#136dec',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
