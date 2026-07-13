import { Component  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserInstanceCardComponent } from "../../shared/components/instance/user-instance-card/user-instance-card.component";
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';


@Component({
  selector: 'app-user-details',
  imports: [UserInstanceCardComponent, PageBreadcrumbComponent],
  templateUrl: './user-details.component.html',
})
export class UserDetailsComponent {}
