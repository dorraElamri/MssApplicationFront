import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LogService, PagedLogsResponseDto } from '../../../../../core/services/log.service';
import { LogEntryDto } from '../../../../../core/models/logs.model';
import { ButtonComponent } from '../../../ui/button/button.component';
import { BadgeComponent } from '../../../ui/badge/badge.component';
import { PaginationComponent } from '../../../ui/pagination/pagination.component';
import flatpickr from 'flatpickr';
import { French } from 'flatpickr/dist/l10n/fr.js';

@Component({
  selector: 'app-logs-table',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BadgeComponent, PaginationComponent],
  templateUrl: './logs-table.component.html',
})
export class LogsTableComponent implements OnInit, AfterViewInit {
  @ViewChild('datepicker') datepicker!: ElementRef<HTMLInputElement>;

  instanceId: string | null = null;
  logs: LogEntryDto[] = [];
  filteredLogs: LogEntryDto[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalCount = 0;
  totalPages = 1;

  // Filtres
  showFilter = false;
  searchTerm = '';
  filterError = false;
  filterWarning = false;
  filterInfo = false;
  filterDebug = false;
  filterProcessed: boolean = false;
  filterNotProcessed: boolean = false;

  activeFiltersCount = 0;

  // Filtre date
  dateRange: string = '';
  displayDate: string = '';

  private flatpickrInstance: flatpickr.Instance | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private logService: LogService
  ) {}

  ngOnInit() {
    this.instanceId = this.route.snapshot.paramMap.get('id');
    if (this.instanceId) {
      this.loadLogs();
    } else {
      this.errorMessage = "Aucun ID d’instance dans l’URL";
    }
  }

  ngAfterViewInit() {
    if (this.datepicker?.nativeElement) {
      this.flatpickrInstance = flatpickr(this.datepicker.nativeElement, {
        mode: 'range',
        dateFormat: 'Y-m-d',
        altInput: true,
        altFormat: 'j F Y',
        locale: French,
        defaultDate: [],
        minDate: '2024-01-01',
        maxDate: 'today',
        onChange: (selectedDates: Date[], dateStr: string, instance: flatpickr.Instance) => {
          this.dateRange = dateStr.trim();
          this.displayDate = instance.altInput?.value?.trim() || dateStr;
          this.applyFilters();
        },
        onClose: () => {
          if (!this.dateRange.trim()) {
            this.displayDate = '';
            this.applyFilters();
          }
        }
      });
    }
  }

  loadLogs(page: number = 1) {
    if (!this.instanceId) return;
    this.isLoading = true;
    this.errorMessage = null;
    this.currentPage = page;

    this.logService.getLogsByInstanceIdPaged(this.instanceId, page, this.pageSize).subscribe({
      next: (paged: PagedLogsResponseDto) => {
        this.logs = paged.data || [];
        this.filteredLogs = [...this.logs];
        this.totalCount = paged.totalCount || 0;
        this.totalPages = Math.ceil(this.totalCount / this.pageSize) || 1;
        this.isLoading = false;
        this.applyFilters();
      },
      error: (err) => {
        this.errorMessage = 'Impossible de charger les logs : ' + (err.status === 404 ? 'Instance non trouvée' : err.message);
        this.isLoading = false;
      }
    });
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.loadLogs(page);
  }

  applyFilters() {
    let filtered = [...this.logs];

    // 1. Recherche texte
    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(term) ||
        log.level.toLowerCase().includes(term) ||
        (log.exception?.message || '').toLowerCase().includes(term) ||
        (log.traceId || '').toLowerCase().includes(term)
      );
    }

    // 2. Filtre niveau
    if (this.filterError || this.filterWarning || this.filterInfo || this.filterDebug) {
      filtered = filtered.filter(log => {
        return (
          (this.filterError && log.level === 'Error') ||
          (this.filterWarning && log.level === 'Warning') ||
          (this.filterInfo && log.level === 'Info') ||
          (this.filterDebug && log.level === 'Debug')
        );
      });
    }

    // 3. Filtre Traitement (CORRIGÉ)
    if (this.filterProcessed || this.filterNotProcessed) {
      filtered = filtered.filter(log => {
        // On accepte boolean true/false ou string "true"/"True"
        const isProcessed = log.isProcessed === 'true' ||
                            log.isProcessed === true ||
                            log.isProcessed === 'True';
        return (this.filterProcessed && isProcessed) || (this.filterNotProcessed && !isProcessed);
      });
    }

    // 4. Filtre date
    if (this.dateRange?.trim()) {
      let separator = ' to ';
      if (this.dateRange.includes(' au ')) separator = ' au ';

      const parts = this.dateRange.trim().split(separator);
      const startRaw = parts[0]?.trim();
      const endRaw = parts.length > 1 ? parts[1]?.trim() : startRaw;

      if (!startRaw || !endRaw) {
        console.warn('Format date invalide :', this.dateRange);
        return;
      }

      const monthsFr: Record<string, string> = {
        'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04', 'mai': '05', 'juin': '06',
        'juillet': '07', 'août': '08', 'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
      };

      const parseFrDate = (frDate: string): string | null => {
        const match = frDate.match(/^(\d{1,2})\s+([a-zéû]+)\s+(\d{4})$/i);
        if (!match) return null;
        const [, day, monthFr, year] = match;
        const month = monthsFr[monthFr.toLowerCase() as keyof typeof monthsFr];
        if (!month) return null;
        return `${year}-${month}-${day.padStart(2, '0')}`;
      };

      const startIso = parseFrDate(startRaw) || startRaw;
      const endIso = parseFrDate(endRaw) || endRaw;

      const start = new Date(startIso + 'T00:00:00Z');
      const end = new Date(endIso + 'T23:59:59.999Z');

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error('Échec parsing dates');
        return;
      }

      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp);
        if (isNaN(logDate.getTime())) return false;
        const logUTC = Date.UTC(
          logDate.getUTCFullYear(), logDate.getUTCMonth(), logDate.getUTCDate(),
          logDate.getUTCHours(), logDate.getUTCMinutes(), logDate.getUTCSeconds()
        );
        return logUTC >= start.getTime() && logUTC <= end.getTime();
      });
    }

    this.filteredLogs = filtered;
    this.updateActiveFiltersCount();

    if (filtered.length === 0 && this.dateRange) {
      this.errorMessage = "Aucun log trouvé pour la période sélectionnée.";
    } else {
      this.errorMessage = null;
    }
  }

  resetFilters() {
    this.searchTerm = '';
    this.filterError = false;
    this.filterWarning = false;
    this.filterInfo = false;
    this.filterDebug = false;
    this.filterProcessed = false;
    this.filterNotProcessed = false;
    this.dateRange = '';
    this.displayDate = '';
    if (this.flatpickrInstance) {
      this.flatpickrInstance.clear();
    }
    this.filteredLogs = [...this.logs];
    this.showFilter = false;
    this.updateActiveFiltersCount();
    this.errorMessage = null;
  }

  updateActiveFiltersCount() {
    this.activeFiltersCount =
      (this.searchTerm.trim() ? 1 : 0) +
      (this.filterError ? 1 : 0) +
      (this.filterWarning ? 1 : 0) +
      (this.filterInfo ? 1 : 0) +
      (this.filterDebug ? 1 : 0) +
      (this.dateRange.trim() ? 1 : 0) +
      (this.filterProcessed ? 1 : 0) +
      (this.filterNotProcessed ? 1 : 0);
  }

  // === CORRIGÉ : Détection propre de isProcessed ===
  getProcessedStatus(log: LogEntryDto): { label: string; color: 'success' | 'error' } {
    // On accepte : true, "true", "True", ou toute valeur truthy
    const isProcessed = !!log.isProcessed || 
                        log.isProcessed === 'true' || 
                        log.isProcessed === 'True';

    return {
      label: isProcessed ? 'Traité' : 'Non traité',
      color: isProcessed ? 'success' : 'error'
    };
  }

  getLevelClass(level: string): string {
    const classes: Record<string, string> = {
      'Error': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
      'Warning': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
      'Info': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
      'Debug': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return classes[level] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}