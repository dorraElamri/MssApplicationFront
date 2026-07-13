import { Component , OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';
import { ToastComponent } from './shared/components/toast/toast.component';



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule,
    ToastComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Angular Ecommerce Dashboard | TailAdmin';

  constructor(private authService: AuthService , private notificationService: NotificationService) {}

   ngOnInit() {
if (localStorage.getItem('token')) {
      this.notificationService.startConnection();
    }  this.notificationService.startConnection()
    .catch(err => console.error('Error starting connection', err));
}

  ngOnDestroy() {
    this.notificationService.stopConnection();
  }


}

