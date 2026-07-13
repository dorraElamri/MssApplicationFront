import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppFormComponent } from '../../shared/components/form/app-form/app-form.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

@Component({
  selector: 'app-applications-addform',
  imports: [AppFormComponent, PageBreadcrumbComponent],
  templateUrl: './applications-addform.component.html',
})
export class ApplicationsAddformComponent implements OnInit {
  isEditMode = false;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.isEditMode = this.route.snapshot.paramMap.has('id');
  }

  get breadcrumbs() {
    return [
      { label: 'Applications', link: '/applications' },
      { label: this.isEditMode ? "Modifier l'Application" : 'Ajouter une Application' }
    ];
  }
}
