import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Toaster } from '@/components/ui/sonner';

const Triage = lazy(() => import('./triage/TriagePage'));

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

export default function App() {
  return (
    <>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={<Triage />} />
          <Route path="/triage" element={<Triage />} />
        </Routes>
      </Suspense>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#FFFFFF',
            border: '1px solid #E7E5E4',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(28, 25, 23, 0.05)',
            color: '#292524',
          },
        }}
      />
    </>
  );
}
