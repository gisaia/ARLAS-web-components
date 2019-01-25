import { Component, OnChanges, Input, Output, SimpleChanges, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { PowerBar } from './model/powerbar';
import * as powerbarsJsonSchema from './powerbars.schema.json';
import { ArlasColorService } from '../../services/color.generator.service';
import { TreeNode, SimpleNode } from 'arlas-d3';

/**
 * Powerbars component transforms a [term, occurence_count] map to a descreasingly sorted list of multiselectable bars.
 * A bar progression represents the term's occurence count.
 */

@Component({
  selector: 'arlas-powerbars',
  templateUrl: './powerbars.component.html',
  styleUrls: ['./powerbars.component.css']
})

export class PowerbarsComponent implements OnInit, OnChanges {
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
  @Input() public colorsSaturationWeight ;

   /**
   * @Input : Angular
   * @description Whether to allow colorizing the bar according to its term or not
   */
  @Input() public useColorService = false;

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

  constructor(private colorService: ArlasColorService) {}

  public static getPowerbarsJsonSchema(): Object {
    return powerbarsJsonSchema;
  }

  public ngOnInit() {
    if (this.level > 1) {
      throw new Error('Not implemented : Only level 1 is supported');
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.inputData) {
      if (this.inputData !== undefined && this.inputData !== null) {
        this.populatePowerbars();
        this.populateSelectedPowerbars();
        this.calculateAllPowerBarsProgression();
      } else {
        this.inputData = {id: 'root', fieldName: 'root', fieldValue: 'root', isOther: false, children: []};
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
    if (this.selectedPaths) {
      Object.assign(selectedPaths, this.selectedPaths);
    }
    if (this.selectedPowerbarsTerms.has(powerBar.term)) {
      powerBar.isSelected = false;
      this.selectedPowerbarsTerms.delete(powerBar.term);
      this.selectedPowerbarsList.delete(powerBar);
      (this.selectedPowerbarsTerms.size === 0) ? this.clearSelection() : powerBar.classSuffix = this.UNSELECTED_BAR;
      /** Remove The paths that contains the selected node */
      const listOfPathsToRemove = [];
      selectedPaths.forEach( path => {
        if (path.length >= this.level) {
          if (path[path.length - this.level].fieldValue === powerBar.term) {
            listOfPathsToRemove.push(selectedPaths.indexOf(path));
          }
        }
      });
      for (let i = 0; i < listOfPathsToRemove.length; i++) {
        selectedPaths.splice(listOfPathsToRemove[i] - i, 1);
      }
      // ##############################################
    } else {
      powerBar.isSelected = true;
      powerBar.classSuffix = this.SELECTED_BAR;
      this.addSelectedPowerbarToList(powerBar);
      this.unselectAllButNotSelectedBars();
      selectedPaths.push(powerBar.path);
    }
    this.selectedPowerBarEvent.next(selectedPaths);
  }

  /**
   * @description Set selected powerbars from outside of the component
   * @param selectedPaths selects the powerbars whose terms are in the selected paths
   */
  public setSelectedPowerbars(selectedPaths: Array<Array<{ fieldName: string, fieldValue: string }>>) {
    this.selectedPowerbarsTerms = new Set();
    this.selectedPowerbarsList = new Set();
    selectedPaths.forEach(path => {
      const currentPath = path.length <= this.level ? path : path.slice(path.length - this.level);
      let powerBar = currentPath.length > 1 ? this.getPowerbar(currentPath[0].fieldValue, currentPath[1].fieldValue) :
        this.getPowerbar(currentPath[0].fieldValue, 'root');
      if (powerBar !== null) {
        powerBar.isSelected = true;
        powerBar.classSuffix = this.SELECTED_BAR;
        if (this.useColorService) {
          powerBar.color = this.colorService.getColor(powerBar.term, this.keysToColors, this.colorsSaturationWeight);
        }
        this.addSelectedPowerbarToList(powerBar);
      } else {
        powerBar = currentPath.length > 1 ? new PowerBar(currentPath[0].fieldValue, currentPath[1].fieldValue, 0) :
          new PowerBar(currentPath[0].fieldValue, 'root', 0);
        powerBar.progression = 0;
        powerBar.isSelected = true;
        powerBar.classSuffix = this.SELECTED_NO_MOUNTED_BAR;
        this.addSelectedPowerbarToList(powerBar);
      }
    });
    this.unselectAllButNotSelectedBars();
  }

  public onKeyUp(searchText: any) {
    this.searchedTerm.next(searchText);
  }

  private clearSelection(): void {
    this.powerBarsList.forEach(powerBar => {
      powerBar.classSuffix = this.NEUTRAL_STATE;
      powerBar.isSelected = false;
    });
  }

  private addSelectedPowerbarToList(powerBar: PowerBar): void {
    // add power bar to selectedPowerbarsTerms
    this.selectedPowerbarsTerms.add(powerBar.term);

    // add powerbar to selectedPowerbarsList
    this.removePowerbarFromSelected(powerBar);
    this.selectedPowerbarsList.add(powerBar);
    if (this.powerBarsList.length > 0) {
      this.sortSelectedPowerBars(this.powerBarsList[0].count);
    }
  }

  private populatePowerbars(): void {
    this.powerBarsList = this.fetchPowerbarsList(this.level, this.inputData);
  }

  private fetchPowerbarsList(level: number, data: TreeNode, powerBarsList?:  Array<PowerBar>, recursivityCount?: number, path?: any) {
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
        currentPath.push({fieldName: child.fieldName, fieldValue: child.fieldValue});
        this.fetchPowerbarsList(level, child, powerBarsList, ++recursivityCount, currentPath);
      });
    } else {
      data.children.forEach(child => {
        const currentPath = [];
        Object.assign(currentPath, path);
        currentPath.push({fieldName: child.fieldName, fieldValue: child.fieldValue});
        if (!child.isOther) {
          const powerBar = new PowerBar(child.fieldValue, data.fieldValue, child.metricValue);
          currentPath.reverse();
          powerBar.path = currentPath;
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
    let sum = 0;
    // calculate the sum
    this.powerBarsList.forEach(powerBar => {
      sum += powerBar.count;
    });
    this.selectedPowerbarsList.forEach(selectedPowerBar => {
      if (this.getPowerbar(selectedPowerBar.term, selectedPowerBar.parentTerm) === null) {
        sum += selectedPowerBar.count;
      }
    });

    // calculate progression
    this.powerBarsList.forEach(powerBar => {
      powerBar.progression = powerBar.count / sum * 100;
      if (powerBar.progression !== 0 && powerBar.progression !== 100 ) {
        powerBar.progression += 1;
      }
    });
    this.selectedPowerbarsList.forEach(selectedPowerBar => {
      selectedPowerBar.progression = selectedPowerBar.count / sum * 100;
      if (selectedPowerBar.progression !== 0 && selectedPowerBar.progression !== 100 ) {
        selectedPowerBar.progression += 1;
      }
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
  private sortSelectedPowerBars(maxPowerBarList: number) {
    const selectedPowerbarsArray = Array.from(this.selectedPowerbarsList);
    selectedPowerbarsArray.sort((a: PowerBar, b: PowerBar) => b.count - a.count);
    this.selectedPowerbarsList = new Set<PowerBar>();
    selectedPowerbarsArray.forEach(powerBar => {
      this.selectedPowerbarsList.add(powerBar);
    });
  }

  // removes the powerbar that has the same term in selectedPowerbarsList but not the same instance
  private removePowerbarFromSelected(powerBar: PowerBar) {
    let powerbarToRemove;
    this.selectedPowerbarsList.forEach(selectedPowerbar => {
      if (selectedPowerbar.term === powerBar.term) {
        powerbarToRemove = selectedPowerbar;
      }
    });
    this.selectedPowerbarsList.delete(powerbarToRemove);
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
