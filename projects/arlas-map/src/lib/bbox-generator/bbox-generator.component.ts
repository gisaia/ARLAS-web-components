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

import { AfterViewInit, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Corner } from '../mapgl/draw/draw.models';
import { MapboxAoiDrawService } from '../mapgl/draw/draw.service';
import { BboxFormGroup } from './bbox-generator.utils';

@Component({
  selector: 'arlas-bbox-generator',
  templateUrl: './bbox-generator.component.html',
  styleUrls: ['./bbox-generator.component.scss']
})
export class BboxGeneratorComponent implements OnInit, AfterViewInit, OnDestroy {
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

  public ngOnDestroy(): void {
    this.bboxForm.subscriptions.forEach(s => s.unsubscribe());
  }

  public close() {
    this.dialogRef.close();
  }

  public generateBbox() {
    this.drawService.drawBbox(this.bboxForm.getFirstCorner(), this.bboxForm.getSecondCorner());
    this.dialogRef.close();
  }

}
