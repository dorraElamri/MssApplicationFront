import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input-field',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputFieldComponent),
      multi: true
    }
  ],
  template: `
    <div class="relative">
      <input
        [type]="type"
        [id]="id"
        [name]="name"
        [placeholder]="placeholder"
        [value]="value"
        [disabled]="disabled"
        [ngClass]="inputClasses"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />
      <p *ngIf="hint"
         class="mt-1.5 text-xs"
         [ngClass]="{
           'text-error-500': error,
           'text-success-500': success,
           'text-gray-500': !error && !success
         }">
        {{ hint }}
      </p>
    </div>
  `
})
export class InputFieldComponent implements ControlValueAccessor {

  @Input() type: string = 'text';
  @Input() id?: string = '';
  @Input() name?: string = '';
  @Input() placeholder?: string = '';
  @Input() success: boolean = false;
  @Input() error?: string;
  @Input() hint?: string;
  @Input() className: string = '';
  @Input() disabled: boolean = false;

  private _value: string | number = '';
  @Input()
  get value(): string | number { return this._value; }
  set value(val: string | number) {
    this._value = val;
    this.onChange(val);
  }

  @Output() valueChange = new EventEmitter<string | number>();

  public onChange: (value: any) => void = () => {};
  public onTouched: () => void = () => {};

  writeValue(value: string | number | null): void { this._value = value ?? ''; }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = this.type === 'number' ? Number(input.value) : input.value;
    this._value = val;
    this.valueChange.emit(val);
    this.onChange(val);
  }

  get inputClasses(): string {
    let classes = `h-11 w-full rounded-lg border px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${this.className}`;
    if (this.disabled) classes += ` text-gray-500 border-gray-300 bg-gray-100 cursor-not-allowed opacity-40 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
    else if (this.error) classes += ` border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800`;
    else if (this.success) classes += ` border-success-500 focus:border-success-300 focus:ring-success-500/20 dark:text-success-400 dark:border-success-500 dark:focus:border-success-800`;
    else classes += ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800`;
    return classes;
  }
}
