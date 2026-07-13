import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BadgeComponent } from '../../ui/badge/badge.component';
import { SafeHtmlPipe } from '../../../pipe/safe-html.pipe';
import { LogStatsResponseDto } from '../../../../core/services/log.service';

@Component({
  selector: 'app-ecommerce-metrics',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeComponent, SafeHtmlPipe],
  templateUrl: './ecommerce-metrics.component.html',
})
export class EcommerceMetricsComponent implements OnInit {

  @Input() stats: LogStatsResponseDto | null = null;
  @Input() isLoading = false;

  @Output() dateRangeChanged = new EventEmitter<{ fromDate?: Date; toDate?: Date }>();
  @Input() selectedInstanceName?: string;
  @Output() openInstanceModal = new EventEmitter<void>();

  selectedPeriod: string = 'today';
  customFromDate: string = '';
  customToDate: string = '';

  public icons = {
    totalIcon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-800 size-6 dark:text-white/90"><path fill-rule="evenodd" clip-rule="evenodd" d="M3 3.75C3 2.7835 3.7835 2 4.75 2H19.25C20.2165 2 21 2.7835 21 3.75V20.25C21 21.2165 20.2165 22 19.25 22H4.75C3.7835 22 3 21.2165 3 20.25V3.75ZM4.75 3.5C4.33579 3.5 4 3.83579 4 4.25V19.75C4 20.1642 4.33579 20.5 4.75 20.5H19.25C19.6642 20.5 20 20.1642 20 19.75V4.25C20 3.83579 19.6642 3.5 19.25 3.5H4.75Z" fill="currentColor"/></svg>`,
    errorIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="text-red-600 size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`,
    warningIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="text-amber-600 size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`,
    infoIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="text-blue-600 size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4v1m0-1a9 9 0 110 18 9 9 0 010-18z" /></svg>`,
    debugIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="text-gray-600 size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 4L2 8l4 4" /></svg>`
  };

  ngOnInit() {
    this.setDefaultDates();
  }

  private setDefaultDates() {
    const today = new Date();
    this.customFromDate = today.toISOString().split('T')[0];
    this.customToDate = today.toISOString().split('T')[0];
  }

  onPeriodChange() {
    const today = new Date();
    let from: Date | undefined;
    let to: Date | undefined;

    switch (this.selectedPeriod) {
      case 'today':
        from = to = today;
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        from = to = yesterday;
        break;
      case 'last7days':
        from = new Date(today);
        from.setDate(from.getDate() - 7);
        to = today;
        break;
      case 'last30days':
        from = new Date(today);
        from.setDate(from.getDate() - 30);
        to = today;
        break;
      case 'custom':
        return;
    }
    this.emitDateRange(from, to);
  }

  onCustomDateChange() {
    if (this.customFromDate && this.customToDate) {
      const from = new Date(this.customFromDate);
      const to = new Date(this.customToDate);
      this.emitDateRange(from, to);
    }
  }

  private emitDateRange(from?: Date, to?: Date) {
    this.dateRangeChanged.emit({ fromDate: from, toDate: to });
  }

  get totalLogs(): number { return this.stats?.totalLogs ?? 0; }
  get errorCount(): number { return this.stats?.errorCount ?? 0; }
  get warningCount(): number { return this.stats?.warningCount ?? 0; }
  get infoCount(): number { return this.stats?.infoCount ?? 0; }
  get debugCount(): number { return this.stats?.debugCount ?? 0; }

  getLevelPercentage(level: string): number {
    if (!this.stats?.levelDistribution) return 0;
    const item = this.stats.levelDistribution.find(l => l.level.toLowerCase() === level.toLowerCase());
    return item ? Math.round(item.percentage) : 0;
  }
}