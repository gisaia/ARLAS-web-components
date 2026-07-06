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

import { DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatError, MatFormField, MatLabel } from '@angular/material/select';
import { MatTooltip } from '@angular/material/tooltip';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslatePipe } from '@ngx-translate/core';
import { Coordinate, PointFormGroup } from '../bbox-generator/coordinates.tools';
import { CoordinatesErrorPipe } from './coordinates.pipe';

@Component({
  selector: 'arlas-coordinates',
  templateUrl: './coordinates.component.html',
  styleUrls: ['./coordinates.component.scss'],
  imports: [
    MatTooltip, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatButtonModule,
    MatInput, MatError, MatIcon, DecimalPipe, TranslatePipe, CoordinatesErrorPipe]
})
export class CoordinatesComponent {
  @Input() public currentLat = '0';
  @Input() public currentLng = '0';

  /**
   * @constant
   */
  public placeHolder = marker('1.1 or 1°6\'3"');

  @Output() public moveToCoordinates$: EventEmitter<[number, number]> = new EventEmitter();
  public coordinatesForm: PointFormGroup;
  public editionMode = false;

  public constructor() {
    this.coordinatesForm = new PointFormGroup(this.currentLat, this.currentLng);
  }

  public switchToEditionMode() {
    this.editionMode = true;
    this.coordinatesForm.latitude.setValue(this.currentLat);
    this.coordinatesForm.longitude.setValue(this.currentLng);
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
