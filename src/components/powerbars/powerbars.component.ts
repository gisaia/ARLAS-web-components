import { Component, OnChanges, Input, Output, SimpleChanges } from '@angular/core';
import { log } from 'util';
import { element } from 'protractor';
import { Subject } from 'rxjs/Subject';
import { PowerBar } from './model/powerbar';


@Component({
  selector: 'arlas-powerbars',
  templateUrl: './powerbars.component.html',
  styleUrls: ['./powerbars.component.css']
})
export class PowerbarsComponent implements OnChanges {
  /**
   * - The component displays an array of [term, count] as bars sorted decreasingly (inputData). The bars length representing the count.
   * - The array of [term, count] is transformed to an array of `PowerBar` object called `powerBarsList` .
   * - When a PowerBar is selected, it is displayed in the top of the list. Moreover, this PowerBar has to be displayed
   * even when the inputData changes and this PowerBar is no more in it.
   * - Therefore; selected PowerBar objects are stored in a second Set : `selectedPowerbarsList`.
   * - To keep the input and output of the component simple, the selected PowerBars are emitted as
   * an array of terms : `selectedPowerbarsTerms` via the `selectedPowerBarEvent` Subject.
   * - And `selectedPowerbarsTerms` can be set from the exterior as an input.
   */
  @Input() public inpuData: Array<[string, number]>;
  @Input() public powerBarsTitle: string;
  @Input() public customizedCssClass;
  @Input() public selectedPowerbarsTerms = new Set<string>();
  @Output() public selectedPowerBarEvent = new Subject<Set<string>>();

  public powerBarsList: Array<PowerBar>;
  public selectedPowerbarsList: Set<PowerBar> = new Set<PowerBar>();

  public SELECTED_BAR = 'selected-bar';
  public UNSELECTED_BAR = 'unselected-bar';
  public NEUTRAL_STATE = 'neutral-state';

  constructor() { }

  public ngOnChanges(changes: SimpleChanges): void {
    if (this.inpuData !== undefined && this.inpuData.length > 0) {
      this.calculatePowerBarsProgression();
      if (this.selectedPowerbarsTerms !== undefined) {
        this.setSelectedPowerbars(this.selectedPowerbarsTerms);
      }
    }
  }

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

  // Set selected powerbars from the exterior of the component
  public setSelectedPowerbars (selectedPowerbars: Set<string>) {
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
    this.sortSelectedPowerBars();
  }

  private calculatePowerBarsProgression(): void {
    this.powerBarsList = new Array<PowerBar>();
    // The inputData is sorted decreasingly
    const maxPowerBarProgression = this.inpuData[0][1];
    this.inpuData.forEach(powerbarElement => {
      const powerBar = new PowerBar(powerbarElement[0], powerbarElement[1], (powerbarElement[1] / maxPowerBarProgression * 100));
      this.powerBarsList.push(powerBar);
    });
  }

  private unselectAllButNotSelectedBars() {
    if (this.selectedPowerbarsTerms.size === 0) {
      this.selectedPowerbarsList = new Set<PowerBar>();
      this.clearSelection();
    } else  {
      this.powerBarsList.forEach(powerBar => {
        if (!this.selectedPowerbarsTerms.has(powerBar.term)) {
          powerBar.classSuffix = 'unselected-bar';
        }
      });
    }
  }

  // Sort the selected PowerBars decreasingly. And recalculate the progression of the bars in this array.
  private sortSelectedPowerBars() {
    const selectedPowerbarsArray = Array.from(this.selectedPowerbarsList);
    selectedPowerbarsArray.sort((a: PowerBar, b: PowerBar) => b.count - a.count);
    this.selectedPowerbarsList = new Set<PowerBar>();
    // recalculate the progression for the selected pack
    const newMax = selectedPowerbarsArray[0].count;
    selectedPowerbarsArray.forEach(powerBar => {
      powerBar.progression = powerBar.count / newMax * 100;
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
        foundPowerbar =  powerbar;
      }
    });
    return foundPowerbar;
  }
}
