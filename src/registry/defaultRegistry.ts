import { globalComponentRegistry } from './ComponentRegistry';
import { FlightCard } from '../components/generative-ui/runtime/FlightCard';
import { HotelCard } from '../components/generative-ui/runtime/HotelCard';
import { BudgetChart } from '../components/generative-ui/runtime/BudgetChart';
import { TimelineView } from '../components/generative-ui/runtime/TimelineView';
import { OverviewCard } from '../components/generative-ui/runtime/OverviewCard';
import { WeatherWidget } from '../components/generative-ui/runtime/WeatherWidget';
import { TableComponent } from '../components/generative-ui/runtime/TableComponent';
import { FormComponent } from '../components/generative-ui/runtime/FormComponent';
import { ListComponent } from '../components/generative-ui/runtime/ListComponent';
import { AnalysisCard } from '../components/generative-ui/runtime/AnalysisCard';
import { ConfidenceBadge } from '../components/generative-ui/runtime/ConfidenceBadge';
import { SystemMetrics } from '../components/generative-ui/runtime/SystemMetrics';
import { MissionCard } from '../components/generative-ui/runtime/MissionCard';
import { MissionReport } from '../components/generative-ui/runtime/MissionReport';

export function initializeRegistry() {
  globalComponentRegistry.register({
    type: 'flight-card',
    name: 'Flight Options',
    component: FlightCard
  });

  globalComponentRegistry.register({
    type: 'hotel-card',
    name: 'Hotel Recommendations',
    component: HotelCard
  });

  globalComponentRegistry.register({
    type: 'budget-chart',
    name: 'Budget Estimate',
    component: BudgetChart
  });

  globalComponentRegistry.register({
    type: 'timeline',
    name: 'Itinerary Timeline',
    component: TimelineView
  });

  globalComponentRegistry.register({
    type: 'overview',
    name: 'Trip Overview',
    component: OverviewCard
  });

  globalComponentRegistry.register({
    type: 'weather',
    name: 'Weather Forecast',
    component: WeatherWidget
  });

  globalComponentRegistry.register({
    type: 'table',
    name: 'Comparison Table',
    component: TableComponent
  });

  globalComponentRegistry.register({
    type: 'form',
    name: 'Interative Form',
    component: FormComponent
  });

  globalComponentRegistry.register({
    type: 'list',
    name: 'Data List',
    component: ListComponent
  });

  globalComponentRegistry.register({
    type: 'analysis',
    name: 'Analysis Card',
    component: AnalysisCard
  });

  globalComponentRegistry.register({
    type: 'confidence-badge',
    name: 'Confidence Badge',
    component: ConfidenceBadge
  });

  globalComponentRegistry.register({
    type: 'system-metrics',
    name: 'System Metrics',
    component: SystemMetrics
  });

  globalComponentRegistry.register({
    type: 'mission-card',
    name: 'Mission Card',
    component: MissionCard
  });

  globalComponentRegistry.register({
    type: 'mission-report',
    name: 'Mission Report',
    component: MissionReport
  });
}
