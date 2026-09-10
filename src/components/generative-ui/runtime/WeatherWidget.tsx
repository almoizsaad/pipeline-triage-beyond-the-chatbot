import { Sun, Cloud, CloudRain, Wind } from 'lucide-react';

export function WeatherWidget({ data }: { id: string; data: Record<string, unknown> }) {
  const forecast = (data?.forecast as Array<{ day: string; temp: string; condition: string }>) || [];
  const location = (data?.location as string) || (data?.destination as string) || 'Paris, France';
  const temperature = (data?.temperature as string) || '';
  const condition = (data?.condition as string) || '';

  const getWeatherIcon = (cond: string) => {
    const c = cond.toLowerCase();
    if (c.includes('rain')) return CloudRain;
    if (c.includes('cloud')) return Cloud;
    if (c.includes('wind')) return Wind;
    return Sun;
  };

  const getWeatherColor = (cond: string) => {
    const c = cond.toLowerCase();
    if (c.includes('rain')) return '#0F766E';
    if (c.includes('cloud')) return '#78716C';
    if (c.includes('wind')) return '#0F766E';
    return '#B45309';
  };

  return (
    <div className="nexus-card p-4 h-full">
      <h3 className="text-sm font-semibold mb-3" style={{ color: '#292524' }}>Weather Forecast</h3>
      {temperature && (
        <div className="flex items-center gap-3 mb-3 p-2 rounded-lg" style={{ background: '#FAF9F6' }}>
          {(() => {
            const Icon = getWeatherIcon(condition);
            return <Icon className="w-5 h-5" style={{ color: getWeatherColor(condition) }} />;
          })()}
          <div>
            <div className="text-lg font-semibold" style={{ color: '#292524' }}>{temperature}</div>
            <div className="text-xs" style={{ color: '#78716C' }}>{condition} · {location}</div>
          </div>
        </div>
      )}
      {!temperature && (
        <div className="flex items-center gap-2 mb-3">
          <Sun className="w-4 h-4" style={{ color: '#B45309' }} />
          <span className="nexus-label">{location}</span>
        </div>
      )}
      <div className="grid grid-cols-4 gap-2 text-center">
        {forecast.map((w, i) => {
          const Icon = getWeatherIcon(w.condition);
          const color = getWeatherColor(w.condition);
          return (
            <div key={i} className="p-2 rounded-lg" style={{ background: '#FAF9F6' }}>
              <div className="text-[10px]" style={{ color: '#A8A29E' }}>{w.day}</div>
              <Icon className="w-4 h-4 mx-auto my-1" style={{ color }} />
              <div className="text-xs font-medium" style={{ color: '#292524' }}>{w.temp}</div>
            </div>
          );
        })}
        {forecast.length === 0 && (
          <>
            {[
              { day: 'Mon', icon: Sun, temp: '18°', color: '#B45309' },
              { day: 'Tue', icon: Cloud, temp: '16°', color: '#78716C' },
              { day: 'Wed', icon: Sun, temp: '20°', color: '#B45309' },
              { day: 'Thu', icon: Wind, temp: '17°', color: '#0F766E' },
            ].map((w, i) => (
              <div key={i} className="p-2 rounded-lg" style={{ background: '#FAF9F6' }}>
                <div className="text-[10px]" style={{ color: '#A8A29E' }}>{w.day}</div>
                <w.icon className="w-4 h-4 mx-auto my-1" style={{ color: w.color }} />
                <div className="text-xs font-medium" style={{ color: '#292524' }}>{w.temp}</div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
