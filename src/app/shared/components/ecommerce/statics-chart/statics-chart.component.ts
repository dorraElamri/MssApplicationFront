import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexFill,
  ApexGrid, ApexLegend, ApexMarkers, ApexStroke, ApexTooltip,
  ApexXAxis, ApexYAxis
} from 'ng-apexcharts';

import { LogService, LogStatsResponseDto, LogTimeSeriesDto } from '../../../../core/services/log.service';

@Component({
  selector: 'app-statics-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './statics-chart.component.html',
})
export class StatisticsChartComponent implements OnInit, OnChanges {

  @Input() fromDate?: string;
  @Input() toDate?: string;

  

  logsOverTime: LogTimeSeriesDto[] = [];
  errorsOverTime: LogTimeSeriesDto[] = [];

  // Configuration ApexCharts
  public series: ApexAxisChartSeries = [];
  public chart: ApexChart = {
    fontFamily: 'Outfit, sans-serif',
    height: 350,
    type: 'area',
    toolbar: { show: false },
  };
  public colors: string[] = ['#465FFF', '#FF6B6B'];
  public stroke: ApexStroke = { curve: 'smooth', width: 3 };
  public fill: ApexFill = { type: 'gradient', gradient: { opacityFrom: 0.6, opacityTo: 0.1 } };
  public markers: ApexMarkers = { size: 0 };
  public grid: ApexGrid = { show: true, borderColor: '#e5e7eb' };
  public dataLabels: ApexDataLabels = { enabled: false };
  public tooltip: ApexTooltip = { x: { format: 'dd MMM yyyy' } };
  public xaxis: ApexXAxis = { type: 'category' };
  public yaxis: ApexYAxis = { labels: { style: { fontSize: '12px' } } };
  public legend: ApexLegend = { show: true, position: 'top' };

  constructor(private logService: LogService) {}

  ngOnInit() {
    this.loadStatistics();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['fromDate'] || changes['toDate']) {
      this.loadStatistics(this.fromDate, this.toDate);
    }
  }

  private loadStatistics(fromDate?: string, toDate?: string) {
    this.logService.getLogStatsWithTimeSeries(fromDate, toDate, undefined, 'day')
      .subscribe({
        next: (stats: LogStatsResponseDto) => {
          this.logsOverTime = stats.logsOverTime;
          this.errorsOverTime = stats.errorsOverTime;

          this.series = [
            { name: 'Total Logs', data: this.logsOverTime.map(item => item.count) },
            { name: 'Erreurs', data: this.errorsOverTime.map(item => item.count) }
          ];

          this.xaxis = {
            ...this.xaxis,
            categories: this.logsOverTime.map(item => item.label)
          };
        },
        error: (err) => console.error('Erreur chargement chart', err)
      });
  }
}