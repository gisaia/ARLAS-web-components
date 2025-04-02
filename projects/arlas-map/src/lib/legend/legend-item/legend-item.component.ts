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

import { Component, DestroyRef, ElementRef, Input, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { ArlasDataLayer } from '../../map/model/layers';
import { Legend, PROPERTY_SELECTOR_SOURCE } from '../legend.config';
import { LegendService } from '../legend.service';
import { OTHER } from '../../map/model/filters';

@Component({
  selector: 'arlas-legend-item',
  templateUrl: './legend-item.component.html',
  styleUrls: ['./legend-item.component.scss']
})
export class LegendItemComponent {
  @Input() public legend: Legend;
  @Input() public title: string;
  @Input() public layer: ArlasDataLayer;
  @Input() public colorPalette: string;
  @ViewChild('interpolated_svg', { read: ElementRef, static: false }) public interpolatedElement: ElementRef;

  protected PROPERTY_SELECTOR_SOURCE = PROPERTY_SELECTOR_SOURCE;

  public constructor(
    private readonly legendService: LegendService,
    private readonly destroyRef: DestroyRef
  ) { }

  public ngOnInit() {
    if (this.legend.manualValues) {
      this.legendService.highlight$
      .pipe(filter(v => v.layerId === this.layer.id), takeUntilDestroyed(this.destroyRef))
      .subscribe(highlight => {
        const colorField = this.legendService.getColorField(this.layer.paint, this.layer.type);
        if (!colorField) {
          return;
        }

        // Get all the unique values from the properties
        const valuesToHighlight = new Set(highlight.properties.map(p => {
          const value = p[colorField];
          if (!this.legend.manualValues.has(value)) {
            return OTHER;
          }
          return value;
        }));

        // Based on what is received, change the highlight
        this.legend.manualValues.forEach((v, k) => {
          v.highlight = valuesToHighlight.has(k);
        });
      });
    }

    // TODO: do it for interpolated values
  }
}
