/* eslint-disable no-unused-expressions */
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

import { Component, Input, OnChanges, OnInit, Output, SimpleChanges, EventEmitter, AfterViewInit } from '@angular/core';
import { SimpleNode, TreeNode } from 'arlas-d3';
import { Subject } from 'rxjs';
import { ArlasColorService } from '../../services/color.generator.service';
import { FilterOperator, PowerBar } from './model/powerbar';
import * as powerbarsJsonSchema from './powerbars.schema.json';
import { NUMBER_FORMAT_CHAR } from '../componentsUtils';
import * as tinycolor from 'tinycolor2';
import { DEFAULT_SHORTENING_PRECISION } from '../../components/componentsUtils';

/**
 * Powerbars component transforms a [term, occurence_count] map to a descreasingly sorted list of multiselectable bars.
 * A bar progression represents the term's occurence count.
 */

@Component({
  selector: 'arlas-powerbars',
  templateUrl: './powerbars.component.html',
  styleUrls: ['./powerbars.component.css']
})

export class PowerbarsComponent implements OnInit, OnChanges, AfterViewInit {
  /**
   * @Input : Angular
   * @description Data formated as a tree to be plotted as powerbars
   */
  @Input() public inputData: TreeNode;

  /**
   * @Input : Angular
   * @description Which level of the tree inputData to plot as powerbars
   */
  @Input() public level = 1;

  /**
   * @Input : Angular
   * @description Powerbar title
   */
  @Input() public powerbarTitle = '';

  /**
   * @Input : Angular
   * @description Unit the a powerbar represents
   */
  @Input() public unit = '';

  /**
   * @Input : Angular
   * @description Css class name to use to customize a specific powerbar's style.
   */
  @Input() public customizedCssClass;
  /**
   * @Input : Angular
   * @description List of selected paths in `inputData` from which the powerbars to select
   * are determined
   */
  @Input() public selectedPaths: Array<Array<SimpleNode>> = new Array<Array<SimpleNode>>();

  /**
   * @Input : Angular
   * @description Whether text input, to filter powerbars, is displayed
   */
  @Input() public displayFilterField = false;

  /**
   * @Input : Angular
   * @description List of [key, color] couples that associates a hex color to each key
   */
  @Input() public keysToColors: Array<[string, string]>;

  /**
   * @Input : Angular
   * @description Knowing that saturation scale is [0, 1], `colorsSaturationWeight` is a
   * factor (between 0 and 1) that tightens this scale to [(1-colorsSaturationWeight), 1].
   * Therefore saturation of generated colors will be within this tightened scale.
   */
  @Input() public colorsSaturationWeight;

  /**
   * @Input : Angular
   * @description Whether to allow colorizing the bar according to its term or not using keysToColors
   */
  @Input() public useColorService = false;
  /**
   * @Input : Angular
   * @description Whether to allow colorizing the bar according to its term or not using a field of the data
   */
  @Input() public useColorFromData = false;
  /**
   * @Input : Angular
   * @description Chart's width. If not specified, the chart takes the component's container width.
   */
  @Input() public chartWidth = null;
  /**
     * @Input : Angular
     * @description Whether the powerbar is scrollable or fully displayed
     */
  @Input() public scrollable = false;

  /**
     * @Input : Angular
     * @description Options about how to apply filters on powerbars
     * - value : The default value.
     *           if 'Eq', the selected powerbar is included in the ARLAS filter.
     *           if 'Neq', the selected powerbar is included in the ARLAS filter.
     * - display: Whether to display a switcher between 'Eq' and 'Neq' or keep the default operator all the time
     */
  @Input() public filterOperator: FilterOperator = {
    value: 'Eq',
    display: true
  };

  @Input() public missingLeafEvent: Subject<any[]>;

  /**
   * @Input : Angular
   * @description Precision when rounding numbers (ie the count next to the progress bar).
   * Default is 2.
   */
  @Input() public numberShorteningPrecision = DEFAULT_SHORTENING_PRECISION;

  /**
   * @Output : Angular
   * @description Emits the filter operator
   */
  @Output() public filterOperatorEvent: EventEmitter<'Neq' | 'Eq'> = new EventEmitter();

  /**
   * @Output : Angular
   * @description Emits the list of selected paths in the tree inputData
   */
  @Output() public selectedPowerBarEvent = new Subject<Array<Array<SimpleNode>>>();

  /**
   * @Output : Angular
   * @description Emits searched term
   */
  @Output() public searchedTerm = new Subject<string>();

  public powerBarsList: Array<PowerBar>;
  public selectedPowerbarsList: Set<PowerBar> = new Set<PowerBar>();
  public selectedPowerbarsTerms: Set<string> = new Set<string>();

  /**
   * @constant
   */
  public SELECTED_BAR = 'selected-bar';
  /**
   * @constant
   */
  public UNSELECTED_BAR = 'unselected-bar';
  /**
   * @constant
   */
  public NEUTRAL_STATE = 'neutral-state';
  /**
   * @constant
   */
  public SELECTED_NO_MOUNTED_BAR = 'selected-no-mounted-bar';

  public NUMBER_FORMAT_CHAR = NUMBER_FORMAT_CHAR;

  constructor(private colorService: ArlasColorService) {


  }

  public static getPowerbarsJsonSchema(): Object {
    return powerbarsJsonSchema;
  }

  public ngOnInit() {
    if (!!this.missingLeafEvent) {
      this.missingLeafEvent.subscribe(data => {
        if (this.selectedPaths !== undefined && this.selectedPaths !== null) {
          this.setSelectedPowerbars(this.selectedPaths);
          data.filter(d => !!d.value).forEach(d => {
            const value = d.value;
            const key = d.key;
            const missingLeaf = Array.from(this.selectedPowerbarsList).filter(pw => pw.term === key)[0];
            const missingLeafToUpdate = Object.assign({}, missingLeaf);
            missingLeafToUpdate.count = value;
            missingLeafToUpdate.isSelected = true;
            missingLeafToUpdate.classSuffix = this.SELECTED_BAR;
            if (this.useColorService) {
              const rgbaColor = tinycolor.default(this.colorService.getColor(missingLeafToUpdate.term, this.keysToColors,
                this.colorsSaturationWeight)).toRgb();
              missingLeafToUpdate.color = 'rgba(' + [rgbaColor.r, rgbaColor.g, rgbaColor.b, 0.7].join(',') + ')';
            }
            this.selectedPowerbarsList.delete(missingLeaf);
            this.selectedPowerbarsList.add(missingLeafToUpdate);
          });
        }
      });
    }

    if (this.level > 1) {
      throw new Error('Not implemented : Only level 1 is supported');
    }
    if (!this.unit) {
      this.unit = '';
    }
  }

  public ngAfterViewInit(): void {
    if (!this.filterOperator) {
      this.filterOperator = {
        value: 'Eq',
        display: true
      };
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.inputData) {
      if (this.inputData !== undefined && this.inputData !== null) {
        this.populatePowerbars();
        this.populateSelectedPowerbars();
        this.calculateAllPowerBarsProgression();
      } else {
        this.inputData = { id: 'root', fieldName: 'root', fieldValue: 'root', isOther: false, children: [] };
        this.powerBarsList = [];
      }
    }

    if (changes.selectedPaths && this.selectedPaths !== undefined && this.selectedPaths !== null) {
      this.setSelectedPowerbars(this.selectedPaths);
    }
  }

  /**
   * @description Select or deselect a PowerBar and emits the terms list of selected bars
   */
  // Select or deselect a PowerBar from the view
  public clickOnPowerbar(powerBar: PowerBar): void {
    const selectedPaths = new Array();
    if (this.selectedPowerbarsTerms.has(powerBar.term)) {
      powerBar.isSelected = false;
      this.selectedPowerbarsTerms.delete(powerBar.term);
      this.selectedPowerbarsList.delete(powerBar);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      (this.selectedPowerbarsTerms.size === 0) ? this.clearSelection() : powerBar.classSuffix = this.UNSELECTED_BAR;
    } else {
      if (this.selectedPaths) {
        Object.assign(selectedPaths, this.selectedPaths);
      }
      powerBar.isSelected = true;
      powerBar.classSuffix = this.SELECTED_BAR;
      this.selectedPowerbarsTerms.add(powerBar.term);
      this.addSelectedPowerbarToList(powerBar, this.selectedPowerbarsList);
      this.unselectAllButNotSelectedBars();
    }
    this.selectedPowerbarsList.forEach(pb => {
      selectedPaths.push(pb.path);
    });
    this.selectedPowerbarsList = this.sortSelectedPowerBars(this.selectedPowerbarsList);
    this.selectedPowerBarEvent.next(selectedPaths);
  }

  /**
   * @description Set selected powerbars from outside of the component
   * @param selectedPaths selects the powerbars whose terms are in the selected paths
   */
  public setSelectedPowerbars(selectedPaths: Array<Array<{ fieldName: string; fieldValue: string; }>>) {
    const selectedPowerbarsTerms = new Set<string>();
    const selectedPowerbarsList = new Set<PowerBar>();
    selectedPaths.forEach(path => {
      const currentPath = path.length <= this.level ? path : path.slice(path.length - this.level);
      let powerBar = currentPath.length > 1 ? this.getPowerbar(currentPath[0].fieldValue, currentPath[1].fieldValue) :
        this.getPowerbar(currentPath[0].fieldValue, 'root');
      if (powerBar !== null) {
        powerBar.isSelected = true;
        powerBar.classSuffix = this.SELECTED_BAR;
        if (this.useColorService) {
          const rgbaColor = tinycolor.default(this.colorService.getColor(powerBar.term, this.keysToColors,
            this.colorsSaturationWeight)).toRgb();
          powerBar.color = 'rgba(' + [rgbaColor.r, rgbaColor.g, rgbaColor.b, 0.7].join(',') + ')';
        }
      } else {


        powerBar = currentPath.length > 1 ? new PowerBar(currentPath[0].fieldValue, currentPath[1].fieldValue, 0) :
          new PowerBar(currentPath[0].fieldValue, 'root', 0);
        powerBar.path = currentPath;
        powerBar.progression = 0;
        powerBar.isSelected = true;
        powerBar.classSuffix = this.SELECTED_NO_MOUNTED_BAR;
      }
      selectedPowerbarsTerms.add(powerBar.term);
      this.addSelectedPowerbarToList(powerBar, selectedPowerbarsList);
    });
    this.selectedPowerbarsTerms = selectedPowerbarsTerms;
    this.selectedPowerbarsList = this.sortSelectedPowerBars(selectedPowerbarsList);
    this.unselectAllButNotSelectedBars();
  }

  public onKeyUp(searchText: any) {
    this.searchedTerm.next(searchText);
  }

  public setOperator(op: 'Eq' | 'Neq'): void {
    if (this.filterOperator.value !== op) {
      this.filterOperator.value = op;
      this.filterOperatorEvent.next(op);
    }
  }

  private clearSelection(): void {
    this.powerBarsList.forEach(powerBar => {
      powerBar.classSuffix = this.NEUTRAL_STATE;
      powerBar.isSelected = false;
    });
  }

  private addSelectedPowerbarToList(powerBar: PowerBar, selectedPowerbarsList: Set<PowerBar>): void {
    // add powerbar to selectedPowerbarsList
    this.removePowerbarFromSelectedOnes(powerBar, selectedPowerbarsList);
    selectedPowerbarsList.add(powerBar);
  }

  private populatePowerbars(): void {
    this.powerBarsList = this.fetchPowerbarsList(this.level, this.inputData);
  }

  private fetchPowerbarsList(level: number, data: TreeNode, powerBarsList?: Array<PowerBar>, recursivityCount?: number, path?: any) {
    if (recursivityCount === undefined) {
      recursivityCount = 0;
    }
    if (!powerBarsList) {
      powerBarsList = new Array<PowerBar>();
    }
    // Each powerbar has a path attribute to the parrent node
    if (!path) {
      path = new Array();
    }
    if (recursivityCount < level - 1) {
      data.children.forEach(child => {
        const currentPath = [];
        Object.assign(currentPath, path);
        currentPath.push({ fieldName: child.fieldName, fieldValue: child.fieldValue });
        this.fetchPowerbarsList(level, child, powerBarsList, ++recursivityCount, currentPath);
      });
    } else {
      data.children.forEach(child => {
        const currentPath = [];
        Object.assign(currentPath, path);
        currentPath.push({ fieldName: child.fieldName, fieldValue: child.fieldValue });
        if (!child.isOther) {
          const powerBar = new PowerBar(child.fieldValue, data.fieldValue, child.metricValue);
          currentPath.reverse();
          powerBar.path = currentPath;
          if (this.useColorService) {
            const rgbaColor = tinycolor.default(this.colorService.getColor(powerBar.term, this.keysToColors,
              this.colorsSaturationWeight)).toRgb();
            powerBar.color = 'rgba(' + [rgbaColor.r, rgbaColor.g, rgbaColor.b, 0.7].join(',') + ')';
          }
          if (this.useColorFromData) {
            powerBar.color = child.color.toString()[0] === '#' ? child.color.toString() : '#'.concat(child.color.toString());
          }
          powerBarsList.push(powerBar);
        }
      });
      return powerBarsList;
    }
  }

  private populateSelectedPowerbars() {
    if (this.selectedPowerbarsTerms !== undefined && this.selectedPowerbarsTerms.size > 0) {
      this.setSelectedPowerbars(this.selectedPaths);
    }
  }

  private calculateAllPowerBarsProgression() {
    // TODO : Manage correctly when count == NaN
    let sum = 0;
    // calculate the sum
    this.powerBarsList.forEach(powerBar => {
      if (powerBar.count.toString() === 'NaN') {
        powerBar.count = 0;
      }
      sum += powerBar.count;
    });
    this.selectedPowerbarsList.forEach(selectedPowerBar => {
      if (selectedPowerBar.count.toString() === 'NaN') {
        selectedPowerBar.count = 0;
      }
      if (this.getPowerbar(selectedPowerBar.term, selectedPowerBar.parentTerm) === null) {
        sum += selectedPowerBar.count;
      }
    });


    // calculate progression
    this.powerBarsList.forEach(powerBar => {
      powerBar.progression = powerBar.count / sum * 100;
      if (powerBar.progression !== 0 && powerBar.progression !== 100) {
        powerBar.progression += 1;
      }
      powerBar.progression = Math.min(powerBar.progression, 100);
    });
    this.selectedPowerbarsList.forEach(selectedPowerBar => {
      selectedPowerBar.progression = selectedPowerBar.count / sum * 100;
      if (selectedPowerBar.progression !== 0 && selectedPowerBar.progression !== 100) {
        selectedPowerBar.progression += 1;
      }
      selectedPowerBar.progression = Math.min(selectedPowerBar.progression, 100);
    });
  }

  private unselectAllButNotSelectedBars() {
    if (this.selectedPowerbarsTerms.size === 0) {
      this.selectedPowerbarsList = new Set<PowerBar>();
      this.clearSelection();
    } else {
      this.powerBarsList.forEach(powerBar => {
        if (!this.selectedPowerbarsTerms.has(powerBar.term)) {
          powerBar.classSuffix = this.UNSELECTED_BAR;
          powerBar.isSelected = false;
        }
      });
    }
  }

  // Sort the selected PowerBars decreasingly. And recalculate the progression of the bars in this array.
  private sortSelectedPowerBars(selectedPowerbarsList: Set<PowerBar>): Set<PowerBar> {
    const selectedPowerbarsArray = Array.from(selectedPowerbarsList);
    const sortedSelectedPowerbarsList = new Set<PowerBar>();
    selectedPowerbarsArray.forEach(powerBar => {
      sortedSelectedPowerbarsList.add(powerBar);
    });
    return sortedSelectedPowerbarsList;
  }

  // removes the powerbar that has the same term in selectedPowerbarsList but not the same instance
  private removePowerbarFromSelectedOnes(powerBar: PowerBar, selectedPowerbarsList: Set<PowerBar>) {
    let powerbarToRemove;
    selectedPowerbarsList.forEach(selectedPowerbar => {
      if (selectedPowerbar.term === powerBar.term) {
        powerbarToRemove = selectedPowerbar;
      }
    });
    selectedPowerbarsList.delete(powerbarToRemove);
  }

  /**
   * @description Gets the powerbar by its term and the term of it's parent node
   *
   */
  private getPowerbar(powerbarTerm: string, powerbarParentTerm: string): PowerBar {
    let foundPowerbar = null;
    this.powerBarsList.forEach(powerbar => {
      if (powerbar.term === powerbarTerm && powerbar.parentTerm === powerbarParentTerm) {
        foundPowerbar = powerbar;
      }
    });
    return foundPowerbar;
  }
}
