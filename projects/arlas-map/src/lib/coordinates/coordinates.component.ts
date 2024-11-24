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

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Coordinate, PointFormGroup } from '../bbox-generator/coordinates.tools';
import { FormControl, FormGroup } from '@angular/forms';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';

@Component({
  selector: 'arlas-coordinates',
  templateUrl: './coordinates.component.html',
  styleUrls: ['./coordinates.component.scss']
})
export class CoordinatesComponent implements OnInit {
  @Input() public currentLat: string;
  @Input() public currentLng: string;

  /**
   * @constant
   */
  public placeHolder = marker('1.1 or 1°6\'3"');

  @Output() public moveToCoordinates$: EventEmitter<[number, number]> = new EventEmitter();
  public coordinatesForm: PointFormGroup;
  public editionMode = false;

  public ngOnInit(): void {
    this.coordinatesForm = new PointFormGroup(this.currentLat, this.currentLng);
  }

  public switchToEditionMode() {
    this.editionMode = true;
    this.coordinatesForm.latitude.setValue(this.currentLat);
    this.coordinatesForm.longitude.setValue(this.currentLng);
  }

  // todo: use a pipe !!!!!!!!!!
  public getErrorMessage(formControl: FormControl | FormGroup) {
    if (formControl.hasError('required')) {
      return marker('You must enter a coordinate');
    }
    return formControl.hasError('pattern') ? this.placeHolder : '';
  }

  public moveToCoordinates() {
    const lat = Coordinate.parse(this.coordinatesForm.latitude.value);
    const lng = Coordinate.parse(this.coordinatesForm.longitude.value);
    this.moveToCoordinates$.emit([lng, lat]);
    this.editionMode = false;
    this.currentLat = String(lat);
    this.currentLng = String(lng);
  }

}
