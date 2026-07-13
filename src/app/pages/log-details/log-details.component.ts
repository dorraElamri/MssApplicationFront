import { Component } from '@angular/core';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { LogCardComponent } from "../../shared/components/log/log-card/log-card.component";
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';


@Component({
  selector: 'app-log-details',
  imports: [LogCardComponent, PageBreadcrumbComponent],
  templateUrl: './log-details.component.html',
})
export class LogDetailsComponent {

}
