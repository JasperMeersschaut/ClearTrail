import type { GeneratedRoute } from '@cleartrail/shared';
import { formatDistance } from '@cleartrail/shared';
import { useSettingsStore } from '../store/settingsStore';

interface AlternativeRoutesProps {
  routes: GeneratedRoute[];
  selectedRouteIndex: number;
  onSelect: (index: number) => void;
}

export function AlternativeRoutesList({
  routes,
  selectedRouteIndex,
  onSelect,
}: AlternativeRoutesProps) {
  const distanceUnit = useSettingsStore((s) => s.distanceUnit);

  if (routes.length === 0) return null;

  return (
    <div className="card">
      <h2>Alternative Routes</h2>
      <ul className="route-list">
        {routes.map((route, index) => {
          const isSelected = index === selectedRouteIndex;
          const color = route.color ?? '#40916c';
          return (
            <li key={index}>
              <button
                type="button"
                className={`route-list-item${isSelected ? ' selected' : ''}`}
                onClick={() => onSelect(index)}
              >
                <span
                  className="route-color-swatch"
                  style={{ backgroundColor: color }}
                />
                <span className="route-list-label">
                  {route.name} • {formatDistance(route.distanceMeters, distanceUnit)} • {route.estimatedDurationMin} min
                </span>
                {isSelected && (
                  <span className="route-selected-badge">Selected</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
