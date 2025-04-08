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
import { OTHER } from '../../map/model/filters';
import { ArlasDataLayer } from '../../map/model/layers';
import { Legend, PROPERTY_SELECTOR_SOURCE } from '../legend.config';
import { LegendService } from '../legend.service';

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

  /** List of cursors to display around the interpolated legend */
  public cursors = new Array<{position: number; value: string;}>();
  // TODO: find the right value?
  /** Maximum number of cursors before not displaying their values */
  public MAX_CURSOR_VALUES = 3;
  // TODO: find the right value?
  /** Minimum distance between two cursors to display their value */
  public MIN_CURSOR_VALUE_DISTANCE = 15;

  public constructor(
    private readonly legendService: LegendService,
    private readonly destroyRef: DestroyRef
  ) { }

  public ngOnInit() {
    // TODO: parameter whether this is wanted?
    this.legendService.highlight$
      .pipe(filter(v => v.layerId === this.layer.id), takeUntilDestroyed(this.destroyRef))
      .subscribe(highlight => {
        if (this.legend.manualValues) {
          this.highlightKeywords(highlight);
        }

        if (this.legend.interpolatedValues) {
          this.displayCursors(highlight);
        }
      });
  }

  /**
   * Change the 'highlight' state of the keywords in the legend to make them pop more
   * @param highlight The features'values to highlight
   */
  private highlightKeywords(highlight: {layerId: string; properties: Array<{[name: string]: any;}>; }) {
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
  }

  /**
   * For every different value to highlight, add a cursor above the legend.
   * If there are less than a certain number of cursors, also display their values if they don't overlap.
   * @param highlight The features'values to highlight
   */
  private displayCursors(highlight: {layerId: string; properties: Array<{[name: string]: any;}>; }) {
    if (!this.legend.title) {
      return;
    }

    const colorField = this.legend.title;

    if (this.legend.title.endsWith('normalized')) {
      const valueField = colorField.split(':')[0] + ':_arlas__short_format';

      this.cursors = highlight.properties
        .map(p => ({ position: Math.min(100, 100 * p[colorField]), value: p[valueField]}));
    } else {
      const min = +this.legend.minValue;
      const max = +this.legend.maxValue;

      this.cursors = highlight.properties
        .map(p => ({ position: Math.min(100, 100 * (p[colorField] - min) / (max - min)), value: p[colorField] }));
    }

    if (this.cursors.length <= this.MAX_CURSOR_VALUES) {
      this.cursors.sort((a, b) => a.position - b.position);

      // Remove some of the values if they are too close to one another
      let lastCursorWithValue = 0;
      this.cursors.forEach((c, idx) => {
        if (idx < this.cursors.length - 1
            && this.cursors[idx + 1].position - this.cursors[lastCursorWithValue].position < this.MIN_CURSOR_VALUE_DISTANCE) {
          this.cursors[idx + 1].value = undefined;
        } else {
          lastCursorWithValue = idx;
        }
      });
    } else {
      this.cursors.forEach(c => c.value = undefined);
    }
  }
}
