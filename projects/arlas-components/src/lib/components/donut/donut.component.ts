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

import { NgClass } from '@angular/common';
import {
  Component, DestroyRef, ElementRef, Input, OnChanges, Output, SimpleChanges, inject, input, output
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ARLASDonutTooltip, AbstractDonut, DonutParams, MultiSelectionDonut, OneSelectionDonut, SimpleNode, TreeNode } from 'arlas-d3';
import { Subject, debounceTime, fromEvent } from 'rxjs';
import { ArlasColorService } from '../../services/color.generator.service';
import { NUMBER_FORMAT_CHAR } from '../componentsUtils';
import * as donutJsonSchema from './donut.schema.json';

@Component({
    selector: 'arlas-donut',
    templateUrl: './donut.component.html',
    styleUrls: ['./donut.component.scss'],
    imports: [MatIconButton, MatTooltip, MatIcon, NgClass, TranslatePipe]
})
export class DonutComponent implements OnChanges {
  /**
   * @Input : Angular
   * @description Data tree to plot in the donut.
   */
  public donutData = input<TreeNode>();

  /**
   * @Input : Angular
   * @description Sets the opacity of non-hovered or non-selected nodes.
   */
  @Input() public opacity = 0.4;

  /**
   * @Input : Angular
   * @description Css class name to use to customize a specific powerbar's style.
   */
  @Input() public customizedCssClass = '';

  /**
   * @Input : Angular
   * @description List of selected nodes.
   */
  @Input() public selectedArcsList: Array<Array<SimpleNode>> = new Array<Array<SimpleNode>>();

  /**
   * @Input : Angular
   * @description Whether the donut is multi-selectable.
   */
  @Input() public multiselectable = true;

  /**
   * @Input : Angular
   * @description id of the donut
   */
  public id = input.required<string>();

  /**
   * @Input : Angular
   * @description List of [key, color] couples that associates a hex color to each key
   */
  @Input() public keysToColors: Array<[string, string]> = [];

  /**
   * @Input : Angular
   * @description Knowing that saturation scale is [0, 1], `colorsSaturationWeight` is a
   * factor (between 0 and 1) that tightens this scale to [(1-colorsSaturationWeight), 1].
   * Therefore colors saturation of donuts arcs will be within this tightened scale..
   */
  @Input() public colorsSaturationWeight = 1 / 2 ;

  /**
   * @Input : Angular
   * @description Diameter of the donut. If it's not set, the donut take the Max(width,height) of the div containing the svg.
   */
  @Input() public diameter?: number;

  /**
   * @Input : Angular
   * @description Width of the svg containing the donut. If it's not set, the container width takes the donut's diameter.
   */
  @Input() public containerWidth?: number;

  /**
   * @Input : Angular
   * @description Unit that a node of the donut represents
   */
  @Input() public unit = '';

  /**
   * @Input : Angular
   * @description Whether to display the export button
   */
  public displayExportButton = input<boolean>(false);

  /**
   * @Output : Angular
   * @description Emits the list of selected nodes and the paths to their ultimate parent
   */
  @Output() public selectedNodesEvent = new Subject<SimpleNode[][]>();

  /**
   * @Output : Angular
   * @description Emits the hovered node and the path to it's parents.
   * The key of the map is the node's name and the value is its color on the donut
   */
  @Output() public hoveredNodesEvent = new Subject<Map<string, string>>();

  /**
   * @Output : Angular
   * @description Emits the information about the hovered node and its parents.
   */
  @Output() public hoveredNodeTooltipEvent = new Subject<ARLASDonutTooltip | null>();

  /**
   * @Output : Angular
   * @description Emits when the export button is clicked
   */
  public exportEvent = output<void>();

  public donut?: AbstractDonut;

  private readonly destroyRef = inject(DestroyRef);

  public constructor(
    private readonly el: ElementRef<HTMLElement>,
    private readonly colorService: ArlasColorService,
    private readonly translate: TranslateService
  ) {
    fromEvent(globalThis, 'resize')
      .pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef))
      .subscribe((event: Event) => {
        if (this.donut) {
          this.donut.resize(this.donut.donutParams.donutContainer);
        }
      });

    this.colorService.changekeysToColors$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.donut) {
          this.donut.donutParams.keysToColors = this.colorService.colorGenerator.keysToColors;
          this.donut.donutParams.donutNodeColorizer = this.colorService;
          this.donut.resize(this.donut.donutParams.donutContainer);
        }
      });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    const data = this.donutData();
    if (this.donut === undefined && data) {
      const donutParams = this.getDonutParams(data);
      if (this.multiselectable) {
        this.donut = new MultiSelectionDonut(donutParams);
      } else {
        this.donut = new OneSelectionDonut(donutParams);
      }
    }

    if (changes.donutData && data && this.donut?.donutParams !== undefined) {
      this.donut.dataChange(data);
    }

    if (changes.selectedArcsList && !!this.selectedArcsList && this.donut?.donutParams?.donutNodes !== undefined) {
      this.donut.onSelectionChange(this.selectedArcsList);
    }
  }

  /**
   * @returns Json schema of the donut component for configuration
   */
  public static getDonutJsonSchema(): Object {
    return donutJsonSchema;
  }

  private getDonutParams(data: TreeNode): DonutParams {
    if (!this.unit) {
      this.unit = '';
    }
    const container = this.el.nativeElement.getElementsByClassName('donut__container').item(0) as HTMLElement;

    const donutParams = new DonutParams(this.id(), data, container.querySelector('svg') as SVGElement, container, this.colorService);
    donutParams.customizedCssClass = this.customizedCssClass;
    donutParams.hoveredNodesEvent = this.hoveredNodesEvent;
    donutParams.tooltipEvent = this.hoveredNodeTooltipEvent;
    donutParams.multiselectable = this.multiselectable;
    donutParams.opacity = this.opacity;
    donutParams.selectedArcsList = this.selectedArcsList;
    donutParams.selectedNodesEvent = this.selectedNodesEvent;
    donutParams.keysToColors = this.keysToColors;
    donutParams.colorsSaturationWeight = this.colorsSaturationWeight;
    donutParams.numberFormatChar = this.translate.instant(NUMBER_FORMAT_CHAR);
    donutParams.diameter = this.diameter;
    donutParams.containerWidth = this.containerWidth;

    return donutParams;
  }
}
