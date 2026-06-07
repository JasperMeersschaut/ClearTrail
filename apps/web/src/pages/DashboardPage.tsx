import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRecentHikes, getUserStats } from '../api';

export function DashboardPage() {
  const statsQuery = useQuery({
    queryKey: ['stats'],
    queryFn: getUserStats,
    retry: false,
  });

  const hikesQuery = useQuery({
    queryKey: ['hikes'],
    queryFn: getRecentHikes,
    retry: false,
  });

  const notAuthenticated =
    statsQuery.error || hikesQuery.error;

  if (notAuthenticated) {
    return (
      <div className="dashboard-page">
        <div className="card">
          <h1>Dashboard</h1>
          <p>Sign in to view your hiking statistics.</p>
          <Link to="/login" className="btn btn-primary">
            Login
          </Link>
        </div>
      </div>
    );
  }

  const stats = statsQuery.data;

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Your Hiking Dashboard</h1>
        <Link to="/">Back to map</Link>
      </header>

      <div className="stats-grid">
        <div className="card stat-card">
          <span className="stat-value">
            {stats?.totalKmWalked.toFixed(1) ?? '—'}
          </span>
          <span className="stat-label">Total km walked</span>
        </div>
        <div className="card stat-card">
          <span className="stat-value">
            {stats?.totalHikingHours.toFixed(1) ?? '—'}
          </span>
          <span className="stat-label">Hiking hours</span>
        </div>
        <div className="card stat-card">
          <span className="stat-value">{stats?.completedRoutes ?? '—'}</span>
          <span className="stat-label">Completed routes</span>
        </div>
      </div>

      <div className="card">
        <h2>Recent Hikes</h2>
        {hikesQuery.isLoading && <p className="muted">Loading...</p>}
        {hikesQuery.data?.length === 0 && (
          <p className="muted">No hikes logged yet.</p>
        )}
        <ul className="hike-list">
          {hikesQuery.data?.map((hike) => (
            <li key={hike.id}>
              <strong>{(hike.distanceMeters / 1000).toFixed(1)} km</strong> ·{' '}
              {hike.durationMinutes} min ·{' '}
              {new Date(hike.completedAt).toLocaleDateString()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
