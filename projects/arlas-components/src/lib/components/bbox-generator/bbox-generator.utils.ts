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

import { FormGroup } from '@angular/forms';
import { Coordinate, PointFormGroup } from '../../tools/coordinates.tools';
import { Corner } from '../mapgl/draw/draw.models';


export class BboxFormGroup extends FormGroup {

  private firstCornerLatitude: string;
  private secondCornerLatitude: string;
  public firstCorner: PointFormGroup;
  public secondCorner: PointFormGroup;
  public latitudeErrors = false;
  public constructor(corner: Corner) {
    const firstCorner = new PointFormGroup(corner.lat - 0.5, corner.lng - 0.5);
    const secondCorner = new PointFormGroup(corner.lat + 0.5, corner.lng + 0.5);
    super({
      firstCorner,
      secondCorner
    });
    this.firstCorner = firstCorner;
    this.secondCorner = secondCorner;

    this.firstCorner.latitude.valueChanges.subscribe(v => {
      this.firstCornerLatitude = v;
      this.secondCornerLatitude = this.secondCorner.latitude.value;
      if (this.secondCornerLatitude !== undefined) {
        if (Coordinate.parse(this.firstCornerLatitude) === Coordinate.parse(this.secondCornerLatitude)) {
          this.latitudeErrors = true;
        } else {
          this.latitudeErrors = false;
        }
      }
    });

    this.secondCorner.latitude.valueChanges.subscribe(v => {
      this.secondCornerLatitude = v;
      this.firstCornerLatitude = this.firstCorner.latitude.value;
      if (this.firstCornerLatitude !== undefined) {
        if (Coordinate.parse(this.firstCornerLatitude) === Coordinate.parse(this.secondCornerLatitude)) {
          this.latitudeErrors = true;
        } else {
          this.latitudeErrors = false;
        }
      }
    });
  }

  public getFirstCorner(): Corner {
    return {
      lat: Coordinate.parse(this.firstCorner.latitude.value),
      lng: Coordinate.parse(this.firstCorner.longitude.value)
    };
  }

  public getSecondCorner(): Corner {
    return {
      lat: Coordinate.parse(this.secondCorner.latitude.value),
      lng: Coordinate.parse(this.secondCorner.longitude.value)
    };
  }
}


