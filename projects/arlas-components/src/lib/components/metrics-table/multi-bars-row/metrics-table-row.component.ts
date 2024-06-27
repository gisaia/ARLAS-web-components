import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PowerBar } from '../../powerbars/model/powerbar';
import { MetricsTableRow } from '../model/metrics-table';


@Component({
  selector: 'arlas-multi-bars-row',
  templateUrl: './metrics-table-row.component.html',
  styleUrls: ['./metrics-table-row.component.scss']
})
export class MetricsTableRowComponent implements OnInit {
  @Input() public displayCheckBox: boolean;
  @Input() public hideSelection: boolean;
  @Input() public metricsTableRow: MetricsTableRow;
  @Input() public useColorService = false;
  @Input() public useColorFromData = false;
  @Input() public colors: string[];
  @Input() public selected: boolean; // trigger change detection
  @Input() public pendingMode = false;
  @Input() public powerBars: PowerBar[] = [];
  @Output() public rowSelected = new EventEmitter();


  public constructor() { }

  public ngOnInit(): void {

  }

  public selectRow() {
    this.updateRowState();
  }


  public onCheck() {
    this.updateRowState();
  }

  public updateRowState(){
    this.metricsTableRow.selected = !this.metricsTableRow.selected;
    this.rowSelected.emit(this.metricsTableRow.term);
  }

  /** TODO : the selection state should be saved an propagated to the parent component.
   */
}
