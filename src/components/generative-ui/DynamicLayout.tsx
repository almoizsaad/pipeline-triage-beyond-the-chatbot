import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspaceStore } from '@/workspace/state/workspaceStore';
import { globalComponentRegistry } from '@/registry/ComponentRegistry';
import { CardSkeleton, EmptyState, ErrorState } from './runtime/Shared';
import { springTransition } from '../../lib/constants';

interface DynamicLayoutProps {
  intent: string;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * ComponentRenderer resolves and renders components from the registry.
 */
const ComponentRenderer = memo(function ComponentRenderer({ id, type, props }: { id: string; type: string; props: Record<string, unknown> }) {
  const definition = globalComponentRegistry.resolve(type);

  if (!definition) {
    return (
      <div className="nexus-card p-4">
        <h3 className="text-sm font-semibold mb-2" style={{ color: '#292524' }}>Unknown Component</h3>
        <div className="text-xs" style={{ color: '#78716C' }}>Type: {type}</div>
      </div>
    );
  }

  const Component = definition.component;
  return <Component id={id} data={props} />;
});

/**
 * DynamicLayout is the primary rendering engine for the Agent Workspace.
 * It maps workspace state components to a responsive grid.
 */
const DynamicLayout = memo(function DynamicLayout({ intent, isLoading, error }: DynamicLayoutProps) {
  const components = useWorkspaceStore((state) => state.components);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-6 p-4 sm:p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="col-span-1 lg:col-span-6">
            <CardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState error={error} />
      </div>
    );
  }

  if (components.length === 0) {
    return (
      <div className="p-6">
        <EmptyState title="No Components" />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={intent}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-6 p-4 sm:p-6 auto-rows-auto"
      >
        {components.map((component, index) => {
          // Calculate responsive column span based on metadata or default
          const position = (component.metadata?.position as { w?: number }) || {};
          const w = position.w || 6;
          let colSpan = 'lg:col-span-6';
          if (w <= 4) colSpan = 'lg:col-span-4';
          else if (w <= 6) colSpan = 'lg:col-span-6';
          else if (w <= 8) colSpan = 'lg:col-span-8';
          else colSpan = 'lg:col-span-12';

          return (
            <motion.div
              key={`${component.id}-${index}`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ ...springTransition, delay: index * 0.08 }}
              className={`col-span-1 ${colSpan}`}
            >
              <div className="h-full">
                <ComponentRenderer 
                  id={component.id} 
                  type={component.type} 
                  props={component.props} 
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
});

export default DynamicLayout;
