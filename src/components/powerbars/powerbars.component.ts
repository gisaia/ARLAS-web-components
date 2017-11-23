import { Component, OnInit, Input, Output } from '@angular/core';
import { log } from 'util';
import { element } from 'protractor';
import { Subject } from 'rxjs/Subject';
import { PowerBar } from './model/powerbar';


@Component({
  selector: 'arlas-powerbars',
  templateUrl: './powerbars.component.html',
  styleUrls: ['./powerbars.component.css']
})
export class PowerbarsComponent implements OnInit {

  public CLEAR_SELECTION = 'Clear selected bar';

  @Input() public inpuData: Array<[string, number]>;
  @Input() public powerBarsTitle: string;
  @Input() public customizedCssClass;

  @Output() public selectedPowerBarEvent = new Subject<string>();

  public powerBarsList: Array<PowerBar>;
  public isClearSelectionButtonShown = false;


  constructor() { }

  public ngOnInit() {
    this.calculatePowerBarsProgression();
  }

  public emitSelectedPowerBar(powerBar: PowerBar) {
    if (powerBar !== null) {
      this.isClearSelectionButtonShown = true;
      powerBar.isSelected = true;
      powerBar.classSuffix = 'selected-bar';
      this.deselectAllButNot(powerBar.term);
      this.selectedPowerBarEvent.next(powerBar.term);
    } else {
      this.selectedPowerBarEvent.next(null);
    }

  }

  public clearSelection() {
    this.isClearSelectionButtonShown = false;
    this.powerBarsList.forEach(powerBar => {
      powerBar.isSelected = false;
      powerBar.classSuffix = 'neutral-state';
    });
    this.emitSelectedPowerBar(null);
  }

  private calculatePowerBarsProgression() {
    this.powerBarsList = new Array<PowerBar>();
    const maxPowerBarProgression = this.inpuData[0][1];
    this.inpuData.forEach(powerbarElement => {
      console.log((powerbarElement[1] / maxPowerBarProgression * 100));

      const powerBar = new PowerBar(powerbarElement[0], powerbarElement[1], (powerbarElement[1] / maxPowerBarProgression * 100));
      this.powerBarsList.push(powerBar);
    });
  }

  private deselectAllButNot(term: string) {
    this.powerBarsList.forEach(powerBar => {
      if (powerBar.term !== term) {
        powerBar.isSelected = false;
        powerBar.classSuffix = 'unselected-bar';
      }
    });
  }

}
