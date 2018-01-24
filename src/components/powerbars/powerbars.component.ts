import { Component, OnChanges, Input, Output, SimpleChanges } from '@angular/core';
import { log } from 'util';
import { element } from 'protractor';
import { Subject } from 'rxjs/Subject';
import { PowerBar } from './model/powerbar';
import * as powerbarsJsonSchema from './powerbars.schema.json';

/**
 * Powerbars component transforms a [term, occurence_count] map to a descreasingly sorted list of multiselectable bars.
 * A bar progression represents the term's occurence count.
 */

@Component({
  selector: 'arlas-powerbars',
  templateUrl: './powerbars.component.html',
  styleUrls: ['./powerbars.component.css']
})

export class PowerbarsComponent implements OnChanges {


  /**
   * @Input : Angular
   * @description List of powerbars
   */
  @Input() public inputData: Array<[string, number]>;
  /**
   * @Input : Angular
   * @description Css class name to use to customize a specific powerbar's style.
   */
  @Input() public customizedCssClass;
  /**
   * @Input : Angular
   * @description Term's list of powerbars to select
   */
  @Input() public selectedPowerbarsTerms = new Set<string>();
  /**
   * @Output : Angular
   * @description Emits the list of selected powerbars terms
   */
  @Output() public selectedPowerBarEvent = new Subject<Set<string>>();

  public powerBarsList: Array<PowerBar>;
  public selectedPowerbarsList: Set<PowerBar> = new Set<PowerBar>();

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

  constructor() { }

  public static getPowerbarsJsonSchema(): Object {
    return powerbarsJsonSchema;
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.inputData) {
      if (this.inputData !== undefined && this.inputData !== null) {
        this.populatePowerbars();
        this.populateSelectedPowerbars();
        this.calculateAllPowerBarsProgression();
      } else {
        this.inputData = [];
        this.powerBarsList = [];
      }
    }

    if (changes.selectedPowerbarsTerms && this.selectedPowerbarsTerms !== undefined && this.selectedPowerbarsTerms !== null) {
      this.selectedPowerbarsList = new Set();
      this.setSelectedPowerbars(this.selectedPowerbarsTerms);
    }
  }

  /**
   * @description Select or deselect a PowerBar and emits the terms list of selected bars
   */
  // Select or deselect a PowerBar from the view
  public clickOnPowerbar(powerBar: PowerBar): void {
    if (this.selectedPowerbarsTerms.has(powerBar.term)) {
      powerBar.isSelected = false;
      this.selectedPowerbarsTerms.delete(powerBar.term);
      this.selectedPowerbarsList.delete(powerBar);
      (this.selectedPowerbarsTerms.size === 0) ? this.clearSelection() : powerBar.classSuffix = this.UNSELECTED_BAR;
    } else {
      powerBar.isSelected = true;
      powerBar.classSuffix = this.SELECTED_BAR;
      this.addSelectedPowerbarToList(powerBar);
      this.unselectAllButNotSelectedBars();
    }
    this.selectedPowerBarEvent.next(this.selectedPowerbarsTerms);
  }

  /**
   * @description Set selected powerbars from outside of the component
   * @param selectedPowerbars selects the powerbars whose terms are passed in the parameter
   */
  public setSelectedPowerbars(selectedPowerbars: Set<string>) {
    selectedPowerbars.forEach(powerbarTerm => {
      const powerBar = this.getPowerbarByTerm(powerbarTerm);
      if (powerBar !== null) {
        powerBar.isSelected = true;
        powerBar.classSuffix = 'selected-bar';
        this.addSelectedPowerbarToList(powerBar);
      }
    });
    this.unselectAllButNotSelectedBars();
  }

  private clearSelection(): void {
    this.powerBarsList.forEach(powerBar => {
      powerBar.classSuffix = this.NEUTRAL_STATE;
    });
  }

  private addSelectedPowerbarToList(powerBar: PowerBar): void {
    // add power bar to selectedPowerbarsTerms
    this.selectedPowerbarsTerms.add(powerBar.term);

    // add powerbar to selectedPowerbarsList
    this.removePowerbarFromSelected(powerBar);
    this.selectedPowerbarsList.add(powerBar);
    this.sortSelectedPowerBars(this.powerBarsList[0].count);
  }

  private populatePowerbars(): void {
    this.powerBarsList = new Array<PowerBar>();
    this.inputData.sort((a: [string, number], b: [string, number]) => b[1] - a[1]);
    this.inputData.forEach(powerbarElement => {
      const powerBar = new PowerBar(powerbarElement[0], powerbarElement[1]);
      this.powerBarsList.push(powerBar);
    });
  }

  private populateSelectedPowerbars() {
    this.selectedPowerbarsList.forEach(selectedPowerBar => {
      selectedPowerBar.count = 0;
    });
    if (this.selectedPowerbarsTerms !== undefined && this.selectedPowerbarsTerms.size > 0) {
      this.setSelectedPowerbars(this.selectedPowerbarsTerms);
    }
  }

  private calculateAllPowerBarsProgression() {
    let sum = 0;
    // calculate the sum
    this.powerBarsList.forEach(powerBar => {
      sum += powerBar.count;
    });
    this.selectedPowerbarsList.forEach(selectedPowerBar => {
      if (this.getPowerbarByTerm(selectedPowerBar.term) === null) {
        sum += selectedPowerBar.count;
      }
    });

    // calculate progression
    this.powerBarsList.forEach(powerBar => {
      powerBar.progression = powerBar.count / sum * 100;
      if (powerBar.progression !== 0) {
        powerBar.progression += 1;
      }
    });
    this.selectedPowerbarsList.forEach(selectedPowerBar => {
      selectedPowerBar.progression = selectedPowerBar.count / sum * 100;
      if (selectedPowerBar.progression !== 0) {
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
          powerBar.classSuffix = 'unselected-bar';
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

  private getPowerbarByTerm(powerbarTerm: string): PowerBar {
    let foundPowerbar = null;
    this.powerBarsList.forEach(powerbar => {
      if (powerbar.term === powerbarTerm) {
        foundPowerbar = powerbar;
      }
    });
    return foundPowerbar;
  }
}
