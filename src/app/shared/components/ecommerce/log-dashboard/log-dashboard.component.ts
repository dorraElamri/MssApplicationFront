// ============================================================
//  log-dashboard.component.ts
//  Dashboard principal — Angular 20 standalone, signals
// ============================================================

import {
  Component, OnInit, OnDestroy, inject, signal,
  computed, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { RouterLink } from '@angular/router';
import{ NotificationService } from '../../../../core/services/notification.service';
import { InstanceService } from './../../../../core/services/instance.service';
import { LogStatsService } from '../../../../core/services/log-stats.service';
import {
  LogStatsResponseV2,
  LogStatsRequestV2,
  InstanceOption,
  DatePreset,
  ServiceStats,
  ExceptionStats,
  HeatmapCell,
  LogTimeSeries,
  DurationBucket
} from '../../../../core/models/ log-stats.models';

import { AuthService } from './../../../../core/services/auth.service';



Chart.register(...registerables);

@Component({
  selector: 'app-log-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DecimalPipe],
  templateUrl: './log-dashboard.component.html',
  styleUrls: ['./log-dashboard.component.css']
})
export class LogDashboardComponent  implements OnInit, OnDestroy {
  private readonly statsService = inject(LogStatsService);
  private readonly fb           = inject(FormBuilder);
  private readonly cdr          = inject(ChangeDetectorRef);
  private readonly destroy$     = new Subject<void>();
  private readonly instanceService = inject(InstanceService);
  private readonly authService = inject(AuthService);

  // ─── Signals ─────────────────────────────────────────────
  stats             = signal<LogStatsResponseV2 | null>(null);
  instances         = signal<InstanceOption[]>([]);
  loading           = signal(false);
  error             = signal<string | null>(null);
  autoRefresh       = signal(false);
  refreshInterval   = signal(30);
  onlyErrors        = signal(false);
  showComparePeriod = signal(false);
  expandedError     = signal<string | null>(null);
  selectedInstances  = signal<string[]>([]);
  instanceSearch     = signal('');
  instancePanelOpen  = signal(false);
  activePreset       = signal<string>('aujourd\'hui');

  filterForm!: FormGroup;
  private charts: Record<string, Chart> = {};

  // ─── Date presets ─────────────────────────────────────────
  readonly datePresets: DatePreset[] = [
    { label: 'Aujourd\'hui',        value: 'today', ...this.buildPreset(0, 0)  },
    { label: ' 7 derniers jours',  value: '7d',    ...this.buildPreset(6, 0)  },
    { label: ' 30 derniers jours', value: '30d',   ...this.buildPreset(29, 0) },
    { label: ' 90 derniers jours', value: '90d',   ...this.buildPreset(89, 0) },
  ];

  // ─── Computed ─────────────────────────────────────────────
  filteredInstances = computed(() => {
    const term = this.instanceSearch().toLowerCase().trim();
    if (!term) return this.instances();
    return this.instances().filter(i =>
      i.host.toLowerCase().includes(term) ||
      (i.applicationName ?? '').toLowerCase().includes(term)
    );
  });



  kpiCards = computed(() => {
    const s = this.stats();
    if (!s) return [];
    const prev = s.previousPeriod;
    return [
      {
        id: 'total', label: 'Total Logs',
        value: this.formatBigNumber(s.totalLogs), rawValue: s.totalLogs,
        icon: 'layers', color: 'blue',
        delta: prev ? prev.totalLogsDeltaPct : null,
        sub: `${s.fromDate?.toString().slice(0,10)} – ${s.toDate?.toString().slice(0,10)}`
      },
      {
        id: 'errors', label: 'Error Rate',
        value: `${(s.errorRate ?? 0).toFixed(1)}%`, rawValue: s.errorRate,
        icon: 'alert-octagon', color: 'red',
        delta: prev ? prev.errorRateDeltaPct : null,
        sub: `${this.formatBigNumber(s.errorCount)} errors`
      },
      {
        id: 'fatal', label: 'Fatal Logs',
        value: this.formatBigNumber(s.fatalCount), rawValue: s.fatalCount,
        icon: 'skull', color: 'purple', delta: null,
        sub: `${((s.fatalCount / Math.max(s.totalLogs, 1)) * 100).toFixed(2)}% of total`
      },
      {
        id: 'duration', label: 'Avg Duration',
        value: `${(s.avgDurationMs ?? 0).toFixed(0)}ms`, rawValue: s.avgDurationMs,
        icon: 'timer', color: 'amber',
        delta: prev ? prev.avgDurationDeltaPct : null,
        sub: `P95: ${(s.p95DurationMs ?? 0).toFixed(0)}ms`
      },
      {
        id: 'slow', label: 'Slow Requests',
        value: `${(s.slowRequestRate ?? 0).toFixed(1)}%`, rawValue: s.slowRequestRate,
        icon: 'clock',
        color: (s.slowRequestRate ?? 0) > 20 ? 'red' : (s.slowRequestRate ?? 0) > 10 ? 'amber' : 'green',
        delta: null, sub: '> 1 second'
      },
      {
        id: 'instances', label: 'Instances',
        value: `${s.onlineInstancesCount}/${s.activeInstancesCount}`, rawValue: s.onlineInstancesCount,
        icon: 'server',
        color: s.onlineInstancesCount === s.activeInstancesCount ? 'green' : 'amber',
        delta: null, sub: `${s.offlineInstancesCount} offline`
      },
      {
        id: 'warnings', label: 'Warnings',
        value: this.formatBigNumber(s.warningCount), rawValue: s.warningCount,
        icon: 'alert-triangle', color: 'orange', delta: null,
        sub: `${((s.warningCount / Math.max(s.totalLogs, 1)) * 100).toFixed(1)}% of total`
      }
    ];
  });

  anomalySeverityClass = computed(() => {
    const a = this.stats()?.detectedAnomalies ?? [];
    if (a.some(x => x.severity === 'Critical')) return 'critical';
    if (a.some(x => x.severity === 'High'))     return 'high';
    if (a.some(x => x.severity === 'Medium'))   return 'medium';
    return 'low';
  });

  // ─── Lifecycle ────────────────────────────────────────────
  // ngOnInit(): void {
  //   this.initForm();
  //   this.loadInstances();
  //   this.applyPreset('7d');
  //   this.loadStats();
  // }

  ngOnInit(): void {
    this.statsService.startConnection();

  this.statsService.dashboardRefresh$
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => {

      console.log('Reload stats');

      this.loadStats();
    });

  this.loadStats();
  this.initForm();
  this.applyPreset('today'); // ou 'today' si tu veux
  this.loadInstances();  
   //this.loadStats(); // ✅ loadStats sera appelé APRÈS
}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    Object.values(this.charts).forEach(c => c.destroy());
  }

  // ─── Init form ────────────────────────────────────────────
  private initForm(): void {
    const preset = this.datePresets.find(p => p.value === 'today')!;
    this.filterForm = this.fb.group({
      fromDate:    [this.toInputDate(preset.fromDate)],
      toDate:      [this.toInputDate(preset.toDate)],
      granularity: ['day']
    });
  }

  // ─── Load instances ───────────────────────────────────────
  // private loadInstances(): void {
  //   this.statsService.getInstances()
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe({
  //       next: inst => this.instances.set(inst),
  //       error: () => {}
  //     });
  // }



  private loadInstances(): void {
  const userId = this.authService.getCurrentUserId();

  if (!userId) {
    this.instances.set([]);
    return;
  }

  this.instanceService.getInstancesOfUser(userId)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        const options: InstanceOption[] = (response.data || []).map(inst => ({
          id: inst.id,
          host: inst.host,
          applicationName: inst.applicationName || '',
          environment: this.getEnvironmentLabel(inst.environment),
          status: inst.status || 'Offline',
          isActive: inst.isActive ?? true
        }));

        this.instances.set(options);

        // ✅ IMPORTANT : sélectionner toutes les instances automatiquement
        const allIds = options.map(i => i.id);
        this.selectedInstances.set(allIds);

        // ✅ Charger les stats APRÈS avoir les instances
        this.loadStats();
      },
      error: (err) => {
        console.error('Erreur chargement instances utilisateur:', err);
        this.instances.set([]);
        this.error.set('Impossible de charger vos instances');
      }
    });
}

// private loadInstances(): void {
//   const userId = this.authService.getCurrentUserId();

//   if (!userId) {
//     this.instances.set([]);
//     return;
//   }

//   this.instanceService.getInstancesOfUser(userId)
//     .pipe(takeUntil(this.destroy$))
//     .subscribe({
//       next: (response) => {
//         const options: InstanceOption[] = (response.data || []).map(inst => ({
//           id: inst.id,
//           host: inst.host,
//           applicationName: inst.applicationName || '',           // ← conversion en string
//           environment: this.getEnvironmentLabel(inst.environment), // ← important
//           status: inst.status || 'Offline',
//           isActive: inst.isActive ?? true                        // ← valeur par défaut
//         }));

//         this.instances.set(options);
//       },
//       error: (err) => {
//         console.error('Erreur chargement instances utilisateur:', err);
//         this.instances.set([]);
//         this.error.set('Impossible de charger vos instances');
//       }
//     });
// }

// Helper pour convertir l'environment (number → string)
private getEnvironmentLabel(env: number): string {
  switch (env) {
    case 0: return 'Development';
    case 1: return 'Staging';
    case 2: return 'Production';
    default: return 'Unknown';
  }
}

  

  // ─── Load stats — VERSION CORRIGÉE ────────────────────────
  // loadStats(): void {
  //   this.loading.set(false);
  //   this.error.set(null);

  //   const form = this.filterForm.value;
  //   const request: LogStatsRequestV2 = {
  //     fromDate:              form.fromDate,
  //     toDate:                form.toDate,
  //     granularity:           form.granularity,
  //     instanceIds:           this.selectedInstances().length ? this.selectedInstances() : undefined,
  //     onlyErrors:            this.onlyErrors(),
  //     includePreviousPeriod: this.showComparePeriod()
  //   };

  //   this.statsService.getStatsV2(request)
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe({
  //       next: (data) => {
  //         this.stats.set(data);        // ✅ mise à jour du signal
  //         this.loading.set(false);     // ✅ masque le loader
  //         this.cdr.markForCheck();     // ✅ force la détection pour OnPush
  //         setTimeout(() => {
  //           this.buildAllCharts();     // ✅ construit les charts après rendu DOM
  //         }, 100);
  //       },
  //       error: (err) => {
  //         // ✅ handler d'erreur correctement activé
  //         this.error.set(err?.message ?? 'Erreur de chargement des statistiques');
  //         this.loading.set(false);
  //         this.cdr.markForCheck();
  //       }
  //     });
  // }




  loadStats(): void {

  if (!this.filterForm?.value?.fromDate || !this.filterForm?.value?.toDate) {
    return;
  }

  if (!this.selectedInstances().length) {
    return;
  }

  this.loading.set(true);
  this.error.set(null);

  const form = this.filterForm.value;

  const request: LogStatsRequestV2 = {
    fromDate: form.fromDate,
    toDate: form.toDate,
    granularity: form.granularity,
    instanceIds: this.selectedInstances(),
    onlyErrors: this.onlyErrors(),
    includePreviousPeriod: this.showComparePeriod()
  };

  this.statsService.getStatsV2(request)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
        this.cdr.markForCheck();

        setTimeout(() => this.buildAllCharts(), 100);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Erreur de chargement des statistiques');
        this.loading.set(false);
        this.cdr.markForCheck();
      }
    });
}

  // ─── Date presets ─────────────────────────────────────────
  applyPreset(value: string): void {
    this.activePreset.set(value);
    const preset = this.datePresets.find(p => p.value === value);
    if (!preset) return;
    this.filterForm?.patchValue({
      fromDate: this.toInputDate(preset.fromDate),
      toDate:   this.toInputDate(preset.toDate)
    });
  }

  // ─── Instance selection ───────────────────────────────────
  toggleInstance(id: string): void {
    const current = this.selectedInstances();
    this.selectedInstances.set(
      current.includes(id) ? current.filter(i => i !== id) : [...current, id]
    );
  }

  clearInstanceSelection(): void {
    this.selectedInstances.set([]);
  }

  clearInstanceSearch(): void {
    this.instanceSearch.set('');
  }

  toggleInstancePanel(): void {
    this.instancePanelOpen.update(v => !v);
    if (!this.instancePanelOpen()) {
      this.instanceSearch.set('');
    }
  }

  // ─── Filters ─────────────────────────────────────────────
  toggleOnlyErrors():    void { this.onlyErrors.update(v => !v); }
  toggleAutoRefresh():   void { this.autoRefresh.update(v => !v); }
  toggleComparePeriod(): void { this.showComparePeriod.update(v => !v); }
  toggleErrorDetail(msg: string): void {
    this.expandedError.update(v => v === msg ? null : msg);
  }

  // ─── Export ──────────────────────────────────────────────
  exportCsv(): void {
    const form = this.filterForm.value;
    const request: LogStatsRequestV2 = {
      fromDate: form.fromDate, toDate: form.toDate,
      granularity: form.granularity,
      instanceIds: this.selectedInstances().length ? this.selectedInstances() : undefined
    };
    this.statsService.exportCsv(request).subscribe(blob => {
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href  = url;
      link.download = `log-stats-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  // ─── Chart builders ──────────────────────────────────────
  private buildAllCharts(): void {
    const s = this.stats();
    if (!s) return;

    this.buildTimelineChart(s.logsOverTime, s.errorsOverTime, s.previousPeriod?.logsOverTime);
    this.buildLevelPieChart(s.levelDistribution ?? []);
    this.buildServicesChart(s.topServices ?? []);
    this.buildExceptionsChart(s.exceptionDistribution ?? []);
    this.buildDurationChart(s.requestDurationStats?.durationBuckets ?? []);
    this.buildDayOfWeekChart(s.logsByDayOfWeek ?? []);

    if (s.requestDurationStats?.durationOverTime?.length) {
      this.buildDurationOverTimeChart(
        s.requestDurationStats.durationOverTime.map(d => ({
          label: d.label, count: Math.round(d.avgDurationMs)
        }))
      );
    }

    this.buildHourlyChart();

  }

  private destroyChart(id: string): void {
    if (this.charts[id]) { this.charts[id].destroy(); delete this.charts[id]; }
  }

  private buildTimelineChart(logs: LogTimeSeries[], errors: LogTimeSeries[], prevLogs?: LogTimeSeries[]): void {
    this.destroyChart('timeline');
    const canvas = document.getElementById('chart-timeline') as HTMLCanvasElement;
    if (!canvas) return;

    const datasets: any[] = [
      {
        label: 'Total Logs', data: logs.map(l => l.count),
        borderColor: '#8788ff', backgroundColor: 'rgba(135,136,255,0.08)',
        borderWidth: 2, fill: true, tension: 0.4,
        pointRadius: logs.length > 30 ? 0 : 3, pointHoverRadius: 5
      },
      {
        label: 'Errors', data: errors.map(e => e.count),
        borderColor: '#f04438', backgroundColor: 'rgba(240,68,56,0.08)',
        borderWidth: 2, fill: true, tension: 0.4,
        pointRadius: logs.length > 30 ? 0 : 3, pointHoverRadius: 5
      }
    ];

    if (prevLogs?.length) {
      datasets.push({
        label: 'Previous Period', data: prevLogs.map(l => l.count),
        borderColor: '#6b7280', backgroundColor: 'transparent',
        borderWidth: 1.5, borderDash: [4, 4], fill: false, tension: 0.4, pointRadius: 0
      });
    }

    this.charts['timeline'] = new Chart(canvas, {
      type: 'line',
      data: { labels: logs.map(l => l.label), datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: '#6B7280', font: { size: 12 } } },
          tooltip: { backgroundColor: '#0C144E', titleColor: '#ffffff', bodyColor: '#C5C6FF' }
        },
        scales: {
          x: { ticks: { color: '#6B7280', maxTicksLimit: 12, font: { size: 11 } }, grid: { color: 'rgba(135,136,255,0.12)' } },
          y: { ticks: { color: '#6B7280' }, grid: { color: 'rgba(135,136,255,0.12)' }, beginAtZero: true }
        }
      }
    });
  }

  private buildLevelPieChart(levels: any[]): void {
    this.destroyChart('pie');
    const canvas = document.getElementById('chart-pie') as HTMLCanvasElement;
    if (!canvas) return;

    const colorMap: Record<string, string> = {
      Error:       '#f04438',
      Fatal:       '#0C144E',
      Warning:     '#f79009',
      Information: '#8788ff',
      Debug:       '#787AEA',
      Trace:       '#B2B3FF',
      Unknown:     '#C5C6FF'
    };

    // Si pas de données, afficher un graphique vide symbolique
    const hasData = levels.some(l => l.count > 0);
    const chartData = hasData ? levels.map(l => l.count) : [1];
    const chartLabels = hasData ? levels.map(l => `${l.level} (${l.percentage}%)`) : ['No data'];
    const chartColors = hasData ? levels.map(l => colorMap[l.level] ?? '#B2B3FF') : ['#0C144E'];

    this.charts['pie'] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: chartLabels,
        datasets: [{ data: chartData, backgroundColor: chartColors, borderWidth: 0, hoverOffset: 6 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        plugins: {
          legend: { position: 'right', labels: { color: '#6B7280', font: { size: 12 }, padding: 12 } },
          tooltip: { backgroundColor: '#0C144E', titleColor: '#ffffff', bodyColor: '#C5C6FF',
            callbacks: { label: (item) => hasData ? ` ${item.label}` : ' No logs yet' }
          }
        }
      }
    });
  }

  private buildServicesChart(services: ServiceStats[]): void {
    this.destroyChart('services');
    const canvas = document.getElementById('chart-services') as HTMLCanvasElement;
    if (!canvas) return;

    const labels = services.length ? services.map(s => s.serviceName) : ['No data'];
    const logData = services.length ? services.map(s => s.logCount) : [0];
    const errData = services.length ? services.map(s => s.errorCount) : [0];

    this.charts['services'] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Total Logs', data: logData, backgroundColor: 'rgba(135,136,255,0.80)', borderRadius: 4, borderSkipped: false },
          { label: 'Erreurs',    data: errData, backgroundColor: 'rgba(240,68,56,0.80)',   borderRadius: 4, borderSkipped: false }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: {
          legend: { labels: { color: '#6B7280', font: { size: 12 } } },
          tooltip: { backgroundColor: '#0C144E', titleColor: '#ffffff', bodyColor: '#C5C6FF' }
        },
        scales: {
          x: { ticks: { color: '#6B7280' }, grid: { color: 'rgba(135,136,255,0.12)' }, beginAtZero: true },
          y: { ticks: { color: '#6B7280', font: { size: 11 } }, grid: { display: false } }
        }
      }
    });
  }

  private buildExceptionsChart(exceptions: ExceptionStats[]): void {
    this.destroyChart('exceptions');
    const canvas = document.getElementById('chart-exceptions') as HTMLCanvasElement;
    if (!canvas) return;

    const top8 = exceptions.slice(0, 8);
    const labels = top8.length ? top8.map(e => e.exceptionType.split('.').pop() ?? e.exceptionType) : ['No exceptions'];
    const data   = top8.length ? top8.map(e => e.count) : [0];
    const purpleScale = ['#0C144E','#8788ff','#787AEA','#B2B3FF','#C5C6FF','#6264d8','#ECECFF','#3d3e7a'];
    const colors = top8.length ? top8.map((_, i) => purpleScale[i % purpleScale.length]) : ['#ECECFF'];

    this.charts['exceptions'] = new Chart(canvas, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Occurrences', data, backgroundColor: colors, borderRadius: 6, borderSkipped: false }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#0C144E', titleColor: '#ffffff', bodyColor: '#C5C6FF',
            callbacks: {
              title: (items) => exceptions[items[0].dataIndex]?.exceptionType ?? '',
              label: (item)  => ` ${item.raw} occurrences`
            }
          }
        },
        scales: {
          x: { ticks: { color: '#6B7280', font: { size: 10 }, maxRotation: 35 }, grid: { display: false } },
          y: { ticks: { color: '#6B7280' }, grid: { color: 'rgba(135,136,255,0.12)' }, beginAtZero: true }
        }
      }
    });
  }

  private buildDurationChart(buckets: DurationBucket[]): void {
    this.destroyChart('duration-buckets');
    const canvas = document.getElementById('chart-duration-buckets') as HTMLCanvasElement;
    if (!canvas) return;

    const labels = buckets.length ? buckets.map(b => b.bucket) : ['0–100ms','100–500ms','500ms–1s','1s–3s','> 3s'];
    const data   = buckets.length ? buckets.map(b => b.percentage) : [0, 0, 0, 0, 0];

    this.charts['duration-buckets'] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: '% of requests', data, backgroundColor: ['#d6f7e8','#8788ff','#787AEA','#B2B3FF','#f4948e'], borderRadius: 6, borderSkipped: false }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#0C144E', titleColor: '#ffffff', bodyColor: '#C5C6FF',
            callbacks: { label: item => ` ${item.raw}% (${buckets[item.dataIndex]?.count ?? 0} req)` }
          }
        },
        scales: {
          x: { ticks: { color: '#6B7280' }, grid: { display: false } },
          y: { ticks: { color: '#6B7280', callback: v => `${v}%` }, grid: { color: 'rgba(135,136,255,0.12)' }, beginAtZero: true }
        }
      }
    });
  }

  private buildDayOfWeekChart(data: any[]): void {
    this.destroyChart('dayofweek');
    const canvas = document.getElementById('chart-dayofweek') as HTMLCanvasElement;
    if (!canvas) return;

    const labels = data.length ? data.map(d => d.dayLabel) : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const counts = data.length ? data.map(d => d.count)    : [0, 0, 0, 0, 0, 0, 0];

    this.charts['dayofweek'] = new Chart(canvas, {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label: 'Log volume', data: counts,
          borderColor: '#0C144E', backgroundColor: 'rgba(135,136,255,0.18)',
          pointBackgroundColor: '#8788ff', borderWidth: 2, pointRadius: 4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          r: {
            ticks: { color: '#9CA3AF', backdropColor: 'transparent', font: { size: 10 } },
            grid: { color: 'rgba(107,114,128,0.15)' },
            pointLabels: { color: '#374151', font: { size: 12, weight: 500 } }
          }
        }
      }
    });
  }

  private buildDurationOverTimeChart(data: LogTimeSeries[]): void {
    this.destroyChart('duration-time');
    const canvas = document.getElementById('chart-duration-time') as HTMLCanvasElement;
    if (!canvas) return;

    this.charts['duration-time'] = new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          label: 'Avg Duration (ms)', data: data.map(d => d.count),
          borderColor: '#787AEA', backgroundColor: 'rgba(120,122,234,0.08)',
          borderWidth: 2, fill: true, tension: 0.4,
          pointRadius: data.length > 30 ? 0 : 3
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#6B7280' } },
          tooltip: { backgroundColor: '#0C144E', titleColor: '#ffffff', bodyColor: '#C5C6FF', callbacks: { label: item => ` ${item.raw}ms` } }
        },
        scales: {
          x: { ticks: { color: '#6B7280', maxTicksLimit: 10 }, grid: { color: 'rgba(135,136,255,0.12)' } },
          y: { ticks: { color: '#6B7280', callback: v => `${v}ms` }, grid: { color: 'rgba(135,136,255,0.12)' }, beginAtZero: true }
        }
      }
    });
  }

getHourlyTotals() {
  const matrix = this.getHeatmapMatrix();
  const totals = Array(24).fill(0);

  matrix.forEach(row => {
    row.forEach(cell => {
      totals[cell.hour] += cell.count;
    });
  });

  return totals;
}
  

  // ─── Heatmap ──────────────────────────────────────────────
  // getHeatmapMatrix(): { day: string; hour: number; intensity: number; count: number }[][] {
  //   const s = this.stats();
  //   const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  //   return days.map((day, dayIdx) =>
  //     Array.from({ length: 24 }, (_, hour) => {
  //       const cell = s?.activityHeatmap?.find(c => c.dayOfWeek === dayIdx && c.hour === hour);
  //       return { day, hour, intensity: cell?.intensity ?? 0, count: cell?.count ?? 0 };
  //     })
  //   );
  // }


  getHeatmapMatrix(): { day: string; hour: number; intensity: number; count: number }[][] {
  const s = this.stats();
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  if (!s?.activityHeatmap?.length) {
    return days.map(day =>
      Array.from({ length: 24 }, (_, hour) => ({
        day,
        hour,
        intensity: 0,
        count: 0
      }))
    );
  }

  // 🔥 trouver le max pour normalisation
  const max = Math.max(...s.activityHeatmap.map(c => c.count), 1);

  return days.map((day, dayIdx) =>
    Array.from({ length: 24 }, (_, hour) => {
      const cell = s.activityHeatmap.find(
        c => c.dayOfWeek === dayIdx && c.hour === hour
      );

      const count = cell?.count ?? 0;

      return {
        day,
        hour,
        count,
        intensity: count / max // ✅ NORMALISÉ
      };
    })
  );
}

  // getHeatmapColor(intensity: number): string {
  //   if (intensity === 0) return 'rgba(30,41,59,0.4)';
  //   const r = Math.round(59  + (239 - 59)  * intensity);
  //   const g = Math.round(130 + (68  - 130) * intensity);
  //   const b = Math.round(246 + (68  - 246) * intensity);
  //   return `rgba(${r},${g},${b},${0.3 + intensity * 0.7})`;
  // }



  getHeatmapColor(intensity: number): string {
  if (intensity === 0) return '#0f172a';

  // gradient bleu → rouge (plus parlant)
  const hue = (1 - intensity) * 220; // bleu → rouge
  return `hsl(${hue}, 85%, ${30 + intensity * 25}%)`;
}



private buildHourlyChart(): void {
  this.destroyChart('heatmap-hours');

  const canvas = document.getElementById('chart-heatmap-hours') as HTMLCanvasElement;
  if (!canvas) return;

  const data = this.getHourlyTotals();

  this.charts['heatmap-hours'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: Array.from({ length: 24 }, (_, i) => `${i}h`),
      datasets: [{
        label: 'Logs',
        data,
        backgroundColor: 'rgba(135,136,255,0.85)',
        borderRadius: 4,
        hoverBackgroundColor: '#0C144E'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { color: '#6B7280' },
          grid: { display: false }
        },
        y: {
          ticks: { color: '#6B7280' },
          grid: { color: 'rgba(135,136,255,0.12)' },
          beginAtZero: true
        }
      }
    }
  });
}

  // ─── Helpers UI ───────────────────────────────────────────
  getLevelClass(level: string): string {
    const map: Record<string, string> = {
      Error: 'badge-error', Fatal: 'badge-fatal', Warning: 'badge-warning',
      Information: 'badge-info', Debug: 'badge-debug', Trace: 'badge-trace'
    };
    return map[level] ?? 'badge-unknown';
  }

  getLevelIcon(level: string): string {
    const map: Record<string, string> = {
      Error: '⛔', Fatal: '💀', Warning: '⚠️', Information: 'ℹ️', Debug: '🔍', Trace: '👣'
    };
    return map[level] ?? '❓';
  }

  getAnomalyIcon(type: string): string {
    const map: Record<string, string> = { ErrorSpike: '📈', SlowRequests: '🐢', HighVolume: '📊' };
    return map[type] ?? '⚠️';
  }

  getSeverityClass(severity: string): string {
    const map: Record<string, string> = {
      Critical: 'severity-critical', High: 'severity-high',
      Medium: 'severity-medium', Low: 'severity-low'
    };
    return map[severity] ?? 'severity-low';
  }

  getStatusClass(status: string): string {
    return status === 'Online' ? 'status-online' : 'status-offline';
  }

  getEnvClass(env: string): string {
    const map: Record<string, string> = {
      Production: 'env-prod', Staging: 'env-staging', Development: 'env-dev'
    };
    return map[env] ?? 'env-dev';
  }

  getKpiCardClass(color: string): string {
    const map: Record<string, string> = {
      blue: 'kpi-blue', red: 'kpi-red', purple: 'kpi-purple',
      amber: 'kpi-amber', green: 'kpi-green', orange: 'kpi-orange'
    };
    return map[color] ?? 'kpi-blue';
  }

  getDeltaClass(delta: number | null): string {
    if (delta === null) return '';
    return delta > 0 ? 'delta-up' : delta < 0 ? 'delta-down' : 'delta-neutral';
  }

  getDeltaIcon(delta: number | null): string {
    if (delta === null) return '';
    return delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
  }

  formatBigNumber(n: number): string {
    if (!n) return '0';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  }

  formatMs(ms: number): string {
    if (!ms) return '0ms';
    return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms.toFixed(0)}ms`;
  }

  formatDate(d: string | undefined): string {
    if (!d) return '—';
    return new Date(d).toLocaleString();
  }

  private toInputDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  private buildPreset(daysBack: number, _: number): { fromDate: Date; toDate: Date } {
    const to = new Date(); to.setHours(23, 59, 59, 999);
    const from = new Date(); from.setDate(from.getDate() - daysBack); from.setHours(0, 0, 0, 0);
    return { fromDate: from, toDate: to };
  }

  // ─── Getters template ─────────────────────────────────────
  get s(): LogStatsResponseV2 | null { return this.stats(); }
  get hasData(): boolean { return !!this.s; } // ← affiche même si totalLogs = 0
  get isGlobal(): boolean { return this.s?.isGlobalView ?? true; }





  
}