import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService, CurrentUser } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { InstanceService } from '../../core/services/instance.service';
import { Instance } from '../../core/models/Instance.model';
import { ApplicationUser } from '../../core/models/application-user';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit, OnDestroy {
  currentUser: CurrentUser | null = null;
  userDetails: ApplicationUser | null = null;
  userRoles: string[] = [];
  instances: Instance[] = [];
  isLoading = true;
  instancesLoading = true;

  private sub = new Subscription();

  readonly envLabels: Record<number, string> = { 0: 'Development', 1: 'Staging', 2: 'Production' };
  readonly skeletonCards = [1, 2, 3];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private instanceService: InstanceService,
  ) {}

  get initials(): string {
    const name = this.userDetails?.fullName || this.currentUser?.name || this.currentUser?.email || 'U';
    return name.split(/\s+/).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  }

  get displayName(): string {
    return this.userDetails?.fullName || this.currentUser?.name || this.userDetails?.userName || '—';
  }

  get displayEmail(): string {
    return this.userDetails?.email || this.currentUser?.email || '—';
  }

  get displayUsername(): string {
    return this.userDetails?.userName || '—';
  }

  get displayRole(): string {
    if (this.userRoles.length > 0) return this.userRoles[0];
    return this.currentUser?.role || '—';
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'ADMIN';
  }

  get onlineCount(): number {
    return this.instances.filter(i => i.status === 'Online').length;
  }

  getEnvLabel(env: number): string {
    return this.envLabels[env] ?? 'Unknown';
  }

  getEnvClasses(env: number): string {
    const map: Record<number, string> = {
      0: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      1: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      2: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    };
    return map[env] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    this.sub.add(
      forkJoin({
        profile: this.userService.getCurrentUser().pipe(catchError(() => of(null))),
        roles: this.userService.getCurrentUserRoles().pipe(catchError(() => of(null))),
      }).subscribe(({ profile, roles }) => {
        if (profile?.success && profile.data) {
          this.userDetails = profile.data;
        }
        if (roles?.success && roles.data?.length) {
          this.userRoles = roles.data;
        }
        this.isLoading = false;
        const userId = this.userDetails?.id || this.currentUser?.id;
        if (userId) {
          this.loadInstances(userId);
        } else {
          this.instancesLoading = false;
        }
      })
    );
  }

  private loadInstances(userId: string): void {
    this.sub.add(
      this.instanceService.getInstancesOfUser(userId).pipe(
        catchError(() => of({ success: true, data: [] as Instance[], message: '' }))
      ).subscribe(res => {
        this.instances = res.data ?? [];
        this.instancesLoading = false;
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
