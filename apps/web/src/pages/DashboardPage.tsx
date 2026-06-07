import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { metersToDisplayUnit } from '@cleartrail/shared';
import { getRecentHikes, getUserStats } from '../api';
import { useAuth } from '../hooks/useAuth';
import { useSettingsStore } from '../store/settingsStore';

export function DashboardPage() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const distanceUnit = useSettingsStore((s) => s.distanceUnit);
  const unitLabel = distanceUnit === 'mi' ? 'mi' : 'km';

  const statsQuery = useQuery({
    queryKey: ['stats'],
    queryFn: getUserStats,
    retry: false,
    enabled: isLoggedIn,
  });

  const hikesQuery = useQuery({
    queryKey: ['hikes'],
    queryFn: getRecentHikes,
    retry: false,
    enabled: isLoggedIn,
  });

  if (authLoading) {
    return (
      <div className="dashboard-page">
        <p className="muted">Loading...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
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
  const totalDistance = stats
    ? metersToDisplayUnit(stats.totalKmWalked * 1000, distanceUnit)
    : null;

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Your Hiking Dashboard</h1>
        <Link to="/">Back to map</Link>
      </header>

      <div className="stats-grid">
        <div className="card stat-card">
          <span className="stat-value">
            {totalDistance?.toFixed(1) ?? '—'}
          </span>
          <span className="stat-label">Total {unitLabel} walked</span>
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
              <strong>
                {metersToDisplayUnit(hike.distanceMeters, distanceUnit).toFixed(1)}{' '}
                {unitLabel}
              </strong>{' '}
              · {hike.durationMinutes} min ·{' '}
              {new Date(hike.completedAt).toLocaleDateString()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
