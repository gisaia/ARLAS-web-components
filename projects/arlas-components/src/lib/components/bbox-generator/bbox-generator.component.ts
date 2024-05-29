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

import { AfterViewInit, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable, merge, mergeMap, of } from 'rxjs';
import { MapboxAoiDrawService } from '../mapgl/draw/draw.service';
import { Corner } from '../mapgl/draw/draw.models';
import { Coordinate, PointFormGroup } from '../../tools/coordinates.tools';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';

@Component({
  selector: 'arlas-bbox-generator',
  templateUrl: './bbox-generator.component.html',
  styleUrls: ['./bbox-generator.component.scss']
})
export class BboxGeneratorComponent implements OnInit, AfterViewInit {
  /**
   * @constant
   */
  public DESCRIPTION = marker('Enter coordinates in decimal or sexagesimal degrees');
  public bboxForm: BboxFormGroup;
  /**
   * @constant
   */
  public placeHolder = marker('Decimal: 1.1 or Sexagesimal 1°6\'3" coordinate');
  public constructor(
    private drawService: MapboxAoiDrawService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: {
      initCorner: Corner;
    },
    public dialogRef: MatDialogRef<BboxGeneratorComponent>,) {
  }

  public ngOnInit(): void {
    if (!!this.data && !this.data.initCorner) {
      this.data.initCorner = {
        lat: 0,
        lng: 0
      };
    }
    this.bboxForm = new BboxFormGroup(this.data.initCorner);
  }
  public ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

  public close() {
    this.dialogRef.close();
  }

  public generateBbox() {
    this.drawService.drawBbox(this.bboxForm.getFirstCorner(), this.bboxForm.getSecondCorner());
    this.dialogRef.close();
  }

}

export class BboxFormGroup extends FormGroup {

  private firstCornerLatitude;
  private secondCornerLatitude;
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


