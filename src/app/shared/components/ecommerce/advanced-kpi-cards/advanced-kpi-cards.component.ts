import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../../ui/badge/badge.component';
import { SafeHtmlPipe } from '../../../pipe/safe-html.pipe';
import { NgApexchartsModule } from 'ng-apexcharts';
import { LogStatsResponseDto } from '../../../../core/services/log.service';

@Component({
  selector: 'app-advanced-kpi-cards',
  standalone: true,
  imports: [
    CommonModule,
    BadgeComponent,
    SafeHtmlPipe,
    NgApexchartsModule
  ],
  templateUrl: './advanced-kpi-cards.component.html',
})
export class AdvancedKpiCardsComponent {

  @Input() currentStats: LogStatsResponseDto | null = null;
  @Input() previousStats: LogStatsResponseDto | null = null;

  // Icônes
  public icons = {
    totalIcon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-800 size-6 dark:text-white/90"><path fill-rule="evenodd" clip-rule="evenodd" d="M3 3.75C3 2.7835 3.7835 2 4.75 2H19.25C20.2165 2 21 2.7835 21 3.75V20.25C21 21.2165 20.2165 22 19.25 22H4.75C3.7835 22 3 21.2165 3 20.25V3.75ZM4.75 3.5C4.33579 3.5 4 3.83579 4 4.25V19.75C4 20.1642 4.33579 20.5 4.75 20.5H19.25C19.6642 20.5 20 20.1642 20 19.75V4.25C20 3.83579 19.6642 3.5 19.25 3.5H4.75Z" fill="currentColor"/></svg>`
  };

  // Calcul de variation (pourcentage de changement)
  getVariation(current: number = 0, previous: number = 0): { value: number; isPositive: boolean; trend: string } {
    if (previous === 0) {
      return { value: 0, isPositive: true, trend: 'neutral' };
    }
    const variation = ((current - previous) / previous) * 100;
    return {
      value: Math.round(Math.abs(variation)),
      isPositive: variation >= 0,
      trend: variation >= 0 ? '↑' : '↓'
    };
  }


  get logsSeries(): number[] {
  return this.currentStats?.logsOverTime?.map(l => l.count) ?? [];
}

get errorsSeries(): number[] {
  return this.currentStats?.errorsOverTime?.map(l => l.count) ?? [];
}
}