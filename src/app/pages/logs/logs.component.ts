import { FormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LogsTableComponent } from '../../shared/components/tables/basic-tables/logs-table/logs-table.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

@Component({
  selector: 'app-logs',
  imports: [CommonModule, FormsModule, LogsTableComponent, PageBreadcrumbComponent],
  templateUrl: './logs.component.html',
})
export class LogsComponent implements OnInit {
  appId: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.appId = this.route.snapshot.paramMap.get('id');
  }

  get breadcrumbs() {
    return [
      { label: 'Applications', link: '/applications' },
      { label: "Détails", link: this.appId ? '/applications-details/' + this.appId : '/applications' },
      { label: 'Logs' }
    ];
  }
}
