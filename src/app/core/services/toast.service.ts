import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;   // en ms
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  private nextId = 1;

  show(toast: Omit<Toast, 'id'>) {
    const newToast: Toast = {
      ...toast,
      id: this.nextId++
    };

    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([newToast, ...currentToasts]);

    // Suppression automatique après la durée
    const duration = toast.duration || (toast.type === 'error' ? 10000 : 5000);
    setTimeout(() => this.remove(newToast.id), duration);
  }

  remove(id: number) {
    const current = this.toastsSubject.value;
    this.toastsSubject.next(current.filter(t => t.id !== id));
  }

  // Méthodes pratiques
  error(title: string, message: string, duration = 10000) {
    this.show({ type: 'error', title, message, duration });
  }

  warning(title: string, message: string, duration = 6000) {
    this.show({ type: 'warning', title, message, duration });
  }

  success(title: string, message: string, duration = 5000) {
    this.show({ type: 'success', title, message, duration });
  }

  info(title: string, message: string, duration = 5000) {
    this.show({ type: 'info', title, message, duration });
  }
}