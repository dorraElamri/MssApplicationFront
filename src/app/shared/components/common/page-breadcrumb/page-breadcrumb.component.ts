import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  link?: string;
}

@Component({
  selector: 'app-page-breadcrumb',
  imports: [RouterModule],
  templateUrl: './page-breadcrumb.component.html',
  styles: ``
})
export class PageBreadcrumbComponent {
  @Input() pageTitle = '';
  @Input() breadcrumbs: BreadcrumbItem[] = [];

  get displayTitle(): string {
    if (this.breadcrumbs.length > 0) {
      return this.breadcrumbs[this.breadcrumbs.length - 1].label;
    }
    return this.pageTitle;
  }

  get navItems(): BreadcrumbItem[] {
    if (this.breadcrumbs.length > 0) return this.breadcrumbs;
    if (this.pageTitle) return [{ label: this.pageTitle }];
    return [];
  }
}
