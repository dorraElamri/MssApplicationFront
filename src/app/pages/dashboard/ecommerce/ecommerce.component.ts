import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EcommerceMetricsComponent } from '../../../shared/components/ecommerce/ecommerce-metrics/ecommerce-metrics.component';
import { StatisticsChartComponent } from '../../../shared/components/ecommerce/statics-chart/statics-chart.component';

import { LogService, LogStatsResponseDto, LogStatsRequestDto } from '../../../core/services/log.service';
import { InstanceService } from '../../../core/services/instance.service';
import { Instance } from '../../../core/models/Instance.model';
import { CamembertChartComponent } from '../../../shared/components/ecommerce/camembert-chart/camembert-chart.component';
import { AdvancedKpiCardsComponent } from '../../../shared/components/ecommerce/advanced-kpi-cards/advanced-kpi-cards.component';
import { LogDashboardComponent } from "../../../shared/components/ecommerce/log-dashboard/log-dashboard.component";
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-ecommerce',
  standalone: true,
  imports: [
    CommonModule,
    LogDashboardComponent],
  templateUrl: './ecommerce.component.html',
})
export class EcommerceComponent  {

 

}
