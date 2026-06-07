import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  estimateDurationMinutes,
  metersToDisplayUnit,
} from '@cleartrail/shared';
import { getRecentHikes, getSavedWalks, getUserStats } from '../api';
import { useAuth } from '../hooks/useAuth';
import { useSettingsStore } from '../store/settingsStore';
import { useWalkSessionStore } from '../store/walkSessionStore';

type DashboardTab = 'history' | 'saved';

export function DashboardPage() {
  const navigate = useNavigate();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const distanceUnit = useSettingsStore((s) => s.distanceUnit);
  const paceMinPerKm = useSettingsStore((s) => s.paceMinPerKm);
  const unitLabel = distanceUnit === 'mi' ? 'mi' : 'km';
  const queueSavedWalkStart = useWalkSessionStore((s) => s.queueSavedWalkStart);
  const setReplayTrack = useWalkSessionStore((s) => s.setReplayTrack);
  const [tab, setTab] = useState<DashboardTab>('history');

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

  const savedQuery = useQuery({
    queryKey: ['saved-walks'],
    queryFn: getSavedWalks,
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
          <p>
            Your walking journal — saved plans, completed walks, and stats grow
            every time you finish a live walk.
          </p>
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

  function handleStartSaved(walk: NonNullable<typeof savedQuery.data>[number]) {
    const budgetMinutes = estimateDurationMinutes(
      walk.distanceMeters,
      paceMinPerKm
    );
    queueSavedWalkStart({
      savedRouteId: walk.id,
      plannedRoute: walk.geojson,
      plannedRouteName: walk.name,
      budgetMinutes,
      paceMinPerKm,
    });
    navigate('/');
  }

  function handleViewTrack(
    track: Array<{ lat: number; lng: number; ts: string }> | undefined
  ) {
    if (!track?.length) return;
    setReplayTrack(track);
    navigate('/');
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Your Walking Journal</h1>
          <p className="muted dashboard-subtitle">
            Saved walks are plans you liked. History is where the day actually
            took you.
          </p>
        </div>
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
          <span className="stat-label">Walks completed</span>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          type="button"
          className={`dashboard-tab ${tab === 'history' ? 'active' : ''}`}
          onClick={() => setTab('history')}
        >
          History
        </button>
        <button
          type="button"
          className={`dashboard-tab ${tab === 'saved' ? 'active' : ''}`}
          onClick={() => setTab('saved')}
        >
          Saved walks
        </button>
      </div>

      {tab === 'history' && (
        <div className="card">
          <h2>Walk history</h2>
          {hikesQuery.isLoading && <p className="muted">Loading...</p>}
          {!hikesQuery.isLoading && hikesQuery.data?.length === 0 && (
            <p className="muted">
              No walks logged yet. Pick a route on the map, tap Start walk, and
              Finish when you&apos;re done.
            </p>
          )}
          <ul className="hike-list">
            {hikesQuery.data?.map((hike) => (
              <li key={hike.id} className="hike-list-item">
                <div>
                  <strong>{hike.notes ?? 'Walk'}</strong>
                  <p className="muted hike-meta">
                    {metersToDisplayUnit(hike.distanceMeters, distanceUnit).toFixed(
                      1
                    )}{' '}
                    {unitLabel} · {hike.durationMinutes} min ·{' '}
                    {new Date(hike.completedAt).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                {hike.actualTrack && hike.actualTrack.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleViewTrack(hike.actualTrack)}
                  >
                    View track
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'saved' && (
        <div className="card">
          <h2>Saved walks</h2>
          {savedQuery.isLoading && <p className="muted">Loading...</p>}
          {!savedQuery.isLoading && savedQuery.data?.length === 0 && (
            <p className="muted">
              No saved walks yet. Generate a route and tap Save walk on the map.
            </p>
          )}
          <ul className="hike-list saved-walks-list">
            {savedQuery.data?.map((walk) => (
              <li key={walk.id} className="hike-list-item">
                <div>
                  <strong>{walk.name}</strong>
                  <p className="muted hike-meta">
                    {metersToDisplayUnit(walk.distanceMeters, distanceUnit).toFixed(
                      1
                    )}{' '}
                    {unitLabel} ·{' '}
                    {estimateDurationMinutes(walk.distanceMeters, paceMinPerKm)}{' '}
                    min
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleStartSaved(walk)}
                >
                  Start
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
