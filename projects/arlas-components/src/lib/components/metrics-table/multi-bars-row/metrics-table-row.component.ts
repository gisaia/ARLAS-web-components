import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MetricsTableRow } from '../metrics-table.component';
import { PowerBar } from '../../powerbars/model/powerbar';
import { NgClass, NgForOf, NgIf, UpperCasePipe } from '@angular/common';
import { PowerbarModule } from '../../powerbars/powerbar/powerbar.module';

@Component({
  selector: 'arlas-multi-bars-row',
  templateUrl: './metrics-table-row.component.html',
  styleUrls: ['./metrics-table-row.component.scss'],
  imports: [
    MatCheckboxModule,
    NgClass,
    PowerbarModule,
    UpperCasePipe,
    NgIf,
    NgForOf
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
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
