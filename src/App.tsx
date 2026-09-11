import { Suspense, lazy } from 'react';

const TriagePage = lazy(() => import('./triage/TriagePage'));

function PageSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FDFCF8' }}>
      <div className="space-y-4 w-64">
        <div className="h-4 rounded w-2/3" style={{ background: '#E7E5E4' }} />
        <div className="h-32 rounded-xl" style={{ background: '#E7E5E4' }} />
        <div className="h-4 rounded w-1/2" style={{ background: '#E7E5E4' }} />
      </div>
    </div>
  );
}

// This is the entire app: one workflow, one screen. There is no router and
// no separate landing page — the triage view IS the homepage. See NOTES.md
// for why a marketing-style entry screen was deliberately removed.
export default function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TriagePage />
    </Suspense>
  );
}
