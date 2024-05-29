import { Pipe, PipeTransform } from '@angular/core';
import { BboxFormGroup } from './bbox-generator.component';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { FormControl, FormGroup } from '@angular/forms';

@Pipe({
  name: 'bboxFormError'
})
export class BboxFormErrorPipe implements PipeTransform {

  public transform(formControl: FormControl | FormGroup): string {
    if (formControl.hasError('required')) {
      return marker('You must enter a coordinate');
    } else if ((formControl as BboxFormGroup).latitudeErrors) {
      return marker('Both corners have the same latitudes, modify one of them.');
    }
    return formControl.hasError('pattern') ? marker('Enter a coordinate in decimal (1.1) or sexagesimal (1° 6\' 3")') : '';
  }

}
