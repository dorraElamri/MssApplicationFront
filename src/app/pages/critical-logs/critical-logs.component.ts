import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NotificationService, NotificationDto } from '../../core/services/notification.service';
import { PaginationComponent } from '../../shared/components/ui/pagination/pagination.component';

@Component({
  selector: 'app-critical-logs',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PaginationComponent],
  templateUrl: './critical-logs.component.html',
})
export class CriticalLogsComponent implements OnInit, OnDestroy {
  notifications: NotificationDto[] = [];
  filteredNotifications: NotificationDto[] = [];
  activeFilter: 'All' | 'Error' | 'Fatal' = 'All';
  searchTerm = '';
  isLoading = true;

  currentPage = 1;
  readonly pageSize = 10;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredNotifications.length / this.pageSize));
  }

  get paginatedNotifications(): NotificationDto[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredNotifications.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  private sub = new Subscription();

  get totalCount(): number { return this.notifications.length; }
  get errorCount(): number { return this.notifications.filter(n => n.type === 'Error').length; }
  get fatalCount(): number { return this.notifications.filter(n => n.type === 'Fatal').length; }
  get unreadCount(): number { return this.notifications.filter(n => !n.isRead).length; }

  readonly skeletonItems = [1, 2, 3, 4, 5];

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.notificationService.startConnection();
    this.sub.add(
      this.notificationService.notifications$.subscribe(notifs => {
        this.notifications = notifs;
        this.isLoading = false;
        this.applyFilters();
      })
    );
  }

  setFilter(f: 'All' | 'Error' | 'Fatal'): void {
    this.activeFilter = f;
    this.applyFilters();
  }

  onSearch(value: string): void {
    this.searchTerm = value;
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.notifications];
    if (this.activeFilter !== 'All') {
      result = result.filter(n => n.type === this.activeFilter);
    }
    if (this.searchTerm.trim()) {
      const s = this.searchTerm.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(s) ||
        n.message.toLowerCase().includes(s) ||
        (n.sourceInstanceName || '').toLowerCase().includes(s)
      );
    }
    this.filteredNotifications = result;
    this.currentPage = 1;
  }

  markAsRead(notif: NotificationDto, event: MouseEvent): void {
    event.stopPropagation();
    this.notificationService.markAsRead(notif);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  navigateToDetails(notif: NotificationDto): void {
    this.notificationService.markAsRead(notif);
    if (notif.logEntryId) {
      this.router.navigate(['/logdetails', notif.logEntryId]);
    }
  }

  clearFilters(): void {
    this.activeFilter = 'All';
    this.searchTerm = '';
    this.applyFilters();
  }

  timeAgo(date: Date | string): string {
    const d = new Date(date);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}j`;
  }

  trackById(_: number, notif: NotificationDto): string {
    return notif.id;
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
