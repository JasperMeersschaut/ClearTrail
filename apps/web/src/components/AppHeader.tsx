import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function AppHeader() {
  const { user, isLoggedIn, isLoading, logout } = useAuth();

  return (
    <header className="app-header">
      <Link to="/" className="logo">
        ClearTrail
      </Link>
      <nav className="app-nav">
        <Link to="/">Map</Link>
        <Link to="/dashboard">Dashboard</Link>
        {isLoggedIn ? (
          <>
            <Link to="/settings">Settings</Link>
            <span className="nav-welcome">
              Welcome, {user?.displayName}
            </span>
            <button type="button" className="nav-logout" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          !isLoading && <Link to="/login">Login</Link>
        )}
      </nav>
    </header>
  );
}
