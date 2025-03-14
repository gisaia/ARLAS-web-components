/*
 * Licensed to Gisaïa under one or more contributor
 * license agreements. See the NOTICE.txt file distributed with
 * this work for additional information regarding copyright
 * ownership. Gisaïa licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Pipe, PipeTransform } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { BboxFormGroup } from './bbox-generator.utils';

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
