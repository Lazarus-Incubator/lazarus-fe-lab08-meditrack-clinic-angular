import { FormControl } from '@angular/forms';
import { futureDateValidator } from './date.validators';

describe('futureDateValidator', () => {
  it('rechaza fechas pasadas', () => {
    const control = new FormControl('2020-01-01T10:00');
    expect(futureDateValidator()(control)).toEqual({ futureDate: true });
  });
});
