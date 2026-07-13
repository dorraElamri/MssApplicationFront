import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { NotificationService, NotificationDto } from '../../../../core/services/notification.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule, DropdownComponent],
  templateUrl: './notification-dropdown.component.html'
})
export class NotificationDropdownComponent implements OnInit {

  isOpen = false;
  notifications$: Observable<NotificationDto[]>;
  unreadCount$: Observable<number>;

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.notifications$ = this.notificationService.notifications$;
    this.unreadCount$ = this.notificationService.unreadCount$;
  }

  ngOnInit() {}

  toggleDropdown() { this.isOpen = !this.isOpen; }
  closeDropdown() { this.isOpen = false; }

  async onNotificationClick(notif: NotificationDto) {
    await this.notificationService.markAsRead(notif);
    if (notif.logEntryId) {
      this.router.navigate(['/logdetails', notif.logEntryId])
        .then(() => window.location.reload());
    }
    this.closeDropdown();
  }

  async markAllAsRead() {
    await this.notificationService.markAllAsRead();
    this.closeDropdown();
  }

  getInstanceName(notif: NotificationDto): string {
    return notif.sourceInstanceName?.trim() || 'Instance inconnue';
  }

  getInstanceInitials(notif: NotificationDto): string {
    const name = this.getInstanceName(notif);
    if (name === 'Instance inconnue') return '??';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  // ✅ Connectivité dynamique
  isInstanceOnline(notif: NotificationDto): boolean {
  // Utilise la valeur enrichie depuis l'Instance
  if (notif.isOnline !== undefined) {
    return notif.isOnline;
  }
  return true; // fallback
}
}