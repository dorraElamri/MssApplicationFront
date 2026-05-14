import { FormsModule } from '@angular/forms';
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { LogsTableComponent } from '../../shared/components/tables/basic-tables/logs-table/logs-table.component';

@Component({
  selector: 'app-logs',
  imports: [CommonModule,
     FormsModule ,   
     ComponentCardComponent,
    LogsTableComponent],
  templateUrl: './logs.component.html',
})
export class LogsComponent  {

}
