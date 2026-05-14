import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InstanceService, CreateInstanceDto } from '../../../../core/services/instance.service';
import { CommonModule } from '@angular/common';
import { ComponentCardComponent } from '../../common/component-card/component-card.component';
import { LabelComponent } from '../label/label.component';
import { InputFieldComponent } from '../input/input-field.component';
import { SelectComponent } from '../select/select.component';
import { TextAreaComponent } from '../input/text-area.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { Instance } from '../../../../core/models/Instance.model';

@Component({
  selector: 'app-app-form',
  standalone: true,
  imports: [
    CommonModule,
    ComponentCardComponent,
    LabelComponent,
    InputFieldComponent,
    SelectComponent,
    TextAreaComponent,
    ButtonComponent,
    RouterLink
],
  templateUrl: './app-form.component.html',
})
export class AppFormComponent implements OnInit {

  // Mode édition ou création
  isEditMode = false;
  instanceId: string | null = null;
  isActive: boolean = true;

  // Champs du formulaire
  applicationName = '';
  host = '';
  logPath = '';
  selectedOption = '';
  message = '';

  // Affichage dynamique
  pageTitle = 'Add Application';
  buttonText = 'Create';

  options = [
    { value: '0', label: 'Development' },
    { value: '1', label: 'Staging' },
    { value: '2', label: 'Production' },
  ];

  errors: any = {};

  // Validation (tu peux garder ou améliorer)
  ipPattern = /^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}$/;
  logPathPattern = /^\/(?:[\w.-]+\/)*[\w.-]+$/;

  constructor(
    private instanceService: InstanceService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.instanceId = this.route.snapshot.paramMap.get('id');

    if (this.instanceId) {
      // Mode édition
      this.isEditMode = true;
      this.pageTitle = 'Edit Application';
      this.buttonText = 'Update';
      this.loadInstanceData();
    } else {
      // Mode création
      this.isEditMode = false;
      this.pageTitle = 'Add Application';
      this.buttonText = 'Create';
    }
  }

 private loadInstanceData() {
    if (!this.instanceId) return;

    this.instanceService.getInstanceById(this.instanceId).subscribe({
      next: (instance: Instance) => {
        this.applicationName = instance.applicationName || '';
        this.host             = instance.host || '';
        this.logPath          = instance.logPath || '';
        this.message          = instance.description || '';
        this.selectedOption   = instance.environment.toString();

        // ─── LIGNE IMPORTANTE À AJOUTER ───────────────────────
        this.isActive = instance.isActive ?? true;
      },
      error: (err) => {
        console.error('Erreur chargement instance', err);
        alert('Impossible de charger les données pour modification');
        this.router.navigate(['/applications/add']);
      }
    });
  }
  handleSelectChange(value: string): void {
    this.selectedOption = value;
    this.errors.environment = !value ? 'Sélection obligatoire' : '';
  }

  validateForm(): boolean {
    this.errors = {};

    if (!this.applicationName.trim()) {
      this.errors.applicationName = 'Nom obligatoire';
    }
    if (!this.host.trim()) {
      this.errors.host = 'Host obligatoire';
    } else if (!this.ipPattern.test(this.host.trim())) {
      this.errors.host = 'Format IP invalide';
    }
    if (!this.logPath.trim()) {
      this.errors.logPath = 'Chemin logs obligatoire';
    } else if (!this.logPathPattern.test(this.logPath.trim())) {
      this.errors.logPath = 'Format chemin invalide';
    }
    if (!this.selectedOption) {
      this.errors.environment = 'Environnement obligatoire';
    }

    return Object.keys(this.errors).length === 0;
  }

 onSubmit(): void {
    if (!this.validateForm()) return;

    const formData = {
      applicationName: this.applicationName.trim() || null,
      host: this.host.trim(),
      logPath: this.logPath.trim() || null,
      description: this.message.trim() || null,
      environment: Number(this.selectedOption) || 0,
    };

    if (this.isEditMode && this.instanceId) {
      // ─── UPDATE : on ajoute isActive (valeur actuelle) ───────
      const updateDto = {
        ...formData,
        isActive: this.isActive   // ← solution clé
      };

      this.instanceService.updateInstance(this.instanceId, updateDto).subscribe({
        next: (res) => {
          if (res?.success) {
            alert('Modifications enregistrées avec succès !');
            this.router.navigate(['/applications-details', this.instanceId]);
          }
        },
        error: (err) => {
          console.error('Update error:', err);
          alert('Échec de la mise à jour : ' + (err.error?.message || err.message || 'Erreur serveur'));
        }
      });
    } else {
    // CREATE
    this.instanceService.createInstance(formData as CreateInstanceDto).subscribe({
      next: (res) => {
        if (res?.success) {
          alert('Instance créée !');
          this.resetForm();
          this.router.navigate(['/applications']);
        }
      },
      error: (err) => {
        console.error('Create error:', err);
        alert('Échec création : ' + (err.error?.message || err.message || 'Erreur'));
      }
    });
  }
}

  private resetForm(): void {
    this.applicationName = '';
    this.host = '';
    this.logPath = '';
    this.selectedOption = '';
    this.message = '';
    this.errors = {};
  }
}