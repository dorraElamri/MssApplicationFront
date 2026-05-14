import { Component  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserInstanceCardComponent } from "../../shared/components/instance/user-instance-card/user-instance-card.component";


@Component({
  selector: 'app-user-details',
  imports: [UserInstanceCardComponent],
  templateUrl: './user-details.component.html',
})
export class UserDetailsComponent {}
