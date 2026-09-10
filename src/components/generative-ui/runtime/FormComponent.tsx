import type { FormEvent } from 'react';
import { componentEvents } from '../../../workspace/events/componentEvents';

export function FormComponent({ id, data }: { id: string; data: Record<string, unknown> }) {
  const fields = (data?.fields as Array<{ label: string; value: string }>) || [];
  const message = (data?.message as string) || '';

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    componentEvents.action(id, 'SUBMIT_FORM', { fields });
  };

  return (
    <div className="nexus-card p-4 h-full">
      <h3 className="text-sm font-semibold mb-3" style={{ color: '#292524' }}>Details</h3>
      {message ? (
        <p className="text-xs" style={{ color: '#78716C' }}>{message}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {fields.map((field, i) => (
            <div key={i}>
              <label className="nexus-label block mb-1" style={{ fontSize: 10 }}>{field.label}</label>
              <input
                type="text"
                defaultValue={field.value}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#BE123C]"
                style={{ background: '#FAF9F6', border: '1px solid #E7E5E4', color: '#292524' }}
              />
            </div>
          ))}
          <button type="submit" className="nexus-btn nexus-btn-primary w-full text-xs py-2">
            Submit
          </button>
        </form>
      )}
    </div>
  );
}
