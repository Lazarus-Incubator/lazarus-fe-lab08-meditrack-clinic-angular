import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function futureDateValidator(): ValidatorFn {
  return (control: AbstractControl<string | null>): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    // Normalize date values before comparing them.
    const selectedDay = control.value.slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    const value = new Date(control.value);
    return Number.isNaN(value.getTime()) || selectedDay <= today ? { futureDate: true } : null;
  };
}
