import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserFormComponent } from '../../shared/components/form/user-form/user-form.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

@Component({
  selector: 'app-user-addform',
  imports: [UserFormComponent, PageBreadcrumbComponent],
  templateUrl: './user-addform.component.html',
})
export class UserAddformComponent implements OnInit {
  isEditMode = false;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.isEditMode = this.route.snapshot.paramMap.has('id');
  }

  get breadcrumbs() {
    return [
      { label: 'Utilisateurs', link: '/usersList' },
      { label: this.isEditMode ? "Modifier l'Utilisateur" : 'Ajouter un Utilisateur' }
    ];
  }
}
