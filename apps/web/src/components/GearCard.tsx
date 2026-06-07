import type { GearRecommendation } from '@cleartrail/shared';

interface GearCardProps {
  gear: GearRecommendation | undefined;
  loading: boolean;
}

export function GearCard({ gear, loading }: GearCardProps) {
  if (loading) {
    return (
      <div className="card">
        <h2>Gear Advisor</h2>
        <p className="muted">Loading recommendations...</p>
      </div>
    );
  }

  if (!gear) return null;

  return (
    <div className="card">
      <h2>Gear Advisor</h2>

      {gear.layers.length > 0 && (
        <section>
          <h3>Layers</h3>
          <ul>
            {gear.layers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {gear.bring.length > 0 && (
        <section>
          <h3>Bring</h3>
          <ul>
            {gear.bring.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {gear.notes.length > 0 && (
        <section>
          <h3>Notes</h3>
          <ul className="notes">
            {gear.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
