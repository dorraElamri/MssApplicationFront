import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [AsyncPipe , CommonModule,],
  templateUrl: './toast.component.html'
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}

  remove(id: number) {
    this.toastService.remove(id);
        console.log('Toast removed:');

    console.log('Toast removed:', id);
  }
}