import { FormControl } from '@angular/forms';
import { rangeValidator } from './vital-signs.validators';

describe('rangeValidator', () => {
  it('rechaza signos vitales fuera de rango', () => {
    const control = new FormControl(49);
    expect(rangeValidator(50, 100, 'Saturacion')(control)).toEqual({
      range: { min: 50, max: 100, label: 'Saturacion' }
    });
  });
});
