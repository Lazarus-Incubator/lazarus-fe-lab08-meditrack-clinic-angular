import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function rangeValidator(min: number, max: number, label: string): ValidatorFn {
  return (control: AbstractControl<number | string | null>): ValidationErrors | null => {
    if (control.value === null || control.value === '') {
      return null;
    }

    const value = Number(control.value);
    if (Number.isNaN(value) || value < min || value > max) {
      return { range: { min, max, label } };
    }

    return null;
  };
}
