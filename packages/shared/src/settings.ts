export type DistanceUnit = 'km' | 'mi';
export type TimeFormat = '24h' | '12h';
export type DateFormat = 'DMY' | 'MDY' | 'YMD';

export interface UserSettings {
  distanceUnit: DistanceUnit;
  timeFormat: TimeFormat;
  dateFormat: DateFormat;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  distanceUnit: 'km',
  timeFormat: '24h',
  dateFormat: 'DMY',
};

export function metersToDisplayUnit(meters: number, unit: DistanceUnit): number {
  return unit === 'mi' ? meters / 1609.344 : meters / 1000;
}

export function formatDistance(meters: number, unit: DistanceUnit): string {
  const value = metersToDisplayUnit(meters, unit);
  return `${value.toFixed(1)} ${unit}`;
}

export function formatTime(iso: string, format: TimeFormat): string {
  const date = new Date(iso);
  if (format === '24h') {
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDate(iso: string, format: DateFormat): string {
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  switch (format) {
    case 'MDY':
      return `${month}/${day}/${year}`;
    case 'YMD':
      return `${year}-${month}-${day}`;
    default:
      return `${day}/${month}/${year}`;
  }
}

export function formatDateTime(
  iso: string,
  settings: Pick<UserSettings, 'timeFormat' | 'dateFormat'>
): string {
  return `${formatDate(iso, settings.dateFormat)} ${formatTime(iso, settings.timeFormat)}`;
}
