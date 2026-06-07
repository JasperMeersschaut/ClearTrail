import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getMe, logout, getUserSettings } from '../api';
import { ApiError } from '../api/client';
import { useSettingsStore } from '../store/settingsStore';

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const setSettings = useSettingsStore((s) => s.setSettings);

  const userQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const { user } = await getMe();
        return user;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60_000,
  });

  useQuery({
    queryKey: ['settings', userQuery.data?.id],
    queryFn: async () => {
      const settings = await getUserSettings();
      setSettings(settings);
      return settings;
    },
    enabled: !!userQuery.data,
    staleTime: 5 * 60_000,
  });

  const handleLogout = async () => {
    await logout();
    queryClient.setQueryData(['auth', 'me'], null);
    queryClient.invalidateQueries({ queryKey: ['stats'] });
    queryClient.invalidateQueries({ queryKey: ['hikes'] });
    navigate('/');
  };

  return {
    user: userQuery.data ?? null,
    isLoggedIn: !!userQuery.data,
    isLoading: userQuery.isLoading,
    logout: handleLogout,
  };
}
