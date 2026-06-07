import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { DateFormat, DistanceUnit, TimeFormat } from '@cleartrail/shared';
import { useAuth } from '../hooks/useAuth';
import { updateUserSettings } from '../api';
import { useSettingsStore } from '../store/settingsStore';

export function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const settings = useSettingsStore();
  const { user, isLoggedIn } = useAuth();

  const saveMutation = useMutation({
    mutationFn: updateUserSettings,
    onSuccess: (saved) => {
      settings.setSettings(saved);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const handleChange = (
    field: 'distanceUnit' | 'timeFormat' | 'dateFormat',
    value: string
  ) => {
    settings.setSettings({ [field]: value });
  };

  const handleSave = () => {
    if (isLoggedIn) {
      saveMutation.mutate({
        distanceUnit: settings.distanceUnit,
        timeFormat: settings.timeFormat,
        dateFormat: settings.dateFormat,
      });
    } else {
      navigate('/');
    }
  };

  return (
    <div className="settings-page">
      <div className="card settings-card">
        <h1>Settings</h1>
        {!isLoggedIn && (
          <p className="muted">
            Settings are saved locally. Sign in to sync across devices.
          </p>
        )}

        <label className="field">
          Distance unit
          <select
            value={settings.distanceUnit}
            onChange={(e) =>
              handleChange('distanceUnit', e.target.value as DistanceUnit)
            }
          >
            <option value="km">Kilometers (km)</option>
            <option value="mi">Miles (mi)</option>
          </select>
        </label>

        <label className="field">
          Time format
          <select
            value={settings.timeFormat}
            onChange={(e) =>
              handleChange('timeFormat', e.target.value as TimeFormat)
            }
          >
            <option value="24h">24-hour</option>
            <option value="12h">12-hour (AM/PM)</option>
          </select>
        </label>

        <label className="field">
          Date format
          <select
            value={settings.dateFormat}
            onChange={(e) =>
              handleChange('dateFormat', e.target.value as DateFormat)
            }
          >
            <option value="DMY">DD/MM/YYYY</option>
            <option value="MDY">MM/DD/YYYY</option>
            <option value="YMD">YYYY-MM-DD</option>
          </select>
        </label>

        <div className="settings-actions">
          <button className="btn btn-primary" onClick={handleSave}>
            {isLoggedIn ? 'Save to account' : 'Done'}
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            Back to map
          </button>
        </div>

        {saveMutation.isSuccess && isLoggedIn && (
          <p className="success-msg">Settings saved.</p>
        )}
        {user && (
          <p className="muted settings-account">
            Signed in as {user.displayName}
          </p>
        )}
      </div>
    </div>
  );
}
