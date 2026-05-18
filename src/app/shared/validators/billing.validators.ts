import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function positivePaymentValidator(): ValidatorFn {
  return (control: AbstractControl<number | string | null>): ValidationErrors | null => {
    const value = Number(control.value);
    return Number.isNaN(value) || value <= 0 ? { positivePayment: true } : null;
  };
}

export function maxDiscountValidator(total: number): ValidatorFn {
  return (control: AbstractControl<number | string | null>): ValidationErrors | null => {
    const value = Number(control.value ?? 0);
    return value < 0 || value > total ? { maxDiscount: { total } } : null;
  };
}
