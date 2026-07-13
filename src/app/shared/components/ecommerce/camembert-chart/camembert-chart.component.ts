import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { LogStatsResponseDto } from '../../../../core/services/log.service';

@Component({
  selector: 'app-camembert-chart',
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './camembert-chart.component.html',
})
export class CamembertChartComponent implements OnChanges {

  @Input() stats: LogStatsResponseDto | null = null;

  public chartOptions: any = null;   // Important : initialiser à null

  ngOnChanges(changes: SimpleChanges) {
    if (changes['stats'] && this.stats?.levelDistribution?.length) {
      this.updateChart();
    }
  }

  private updateChart() {
    if (!this.stats?.levelDistribution || this.stats.levelDistribution.length === 0) {
      this.chartOptions = null;
      return;
    }

    const series = this.stats.levelDistribution.map(item => item.count);
    const labels = this.stats.levelDistribution.map(item => item.level);

    this.chartOptions = {
      series: series,
      chart: {
        type: 'donut',           // 'donut' est plus beau que 'pie' pour les KPI
        height: 380,
        fontFamily: 'Outfit, sans-serif',
        toolbar: { show: false }
      },
      labels: labels,
      colors: ['#ef4444', '#f59e0b', '#3b82f6', '#6b7280', '#10b981', '#8b5cf6'],
      legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        fontSize: '14px',
        markers: { width: 12, height: 12, radius: 2 },
        itemMargin: { horizontal: 15, vertical: 5 }
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number, opts: any) => {
          return val.toFixed(1) + '%';
        },
        style: {
          fontSize: '15px',
          fontWeight: '600',
          colors: ['#fff']
        },
        dropShadow: { enabled: true, top: 1, left: 1, blur: 1, opacity: 0.45 }
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              name: { show: false },
              value: {
                show: true,
                fontSize: '22px',
                fontWeight: '700',
                color: '#111827'
              },
              total: {
                show: true,
                label: 'Total',
                fontSize: '14px',
                color: '#6b7280',
                formatter: () => this.stats?.totalLogs?.toLocaleString() || '0'
              }
            }
          }
        }
      },
      tooltip: {
        y: {
          formatter: (val: number) => val.toLocaleString() + ' logs'
        }
      },
      responsive: [{
        breakpoint: 640,
        options: { chart: { height: 320 } }
      }]
    };
  }
}