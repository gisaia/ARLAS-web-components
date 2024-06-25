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
  @Input() public multiBarRowData: MetricsTableRow;
  @Input() public useColorService = false;
  @Input() public useColorFromData = false;
  @Input() public colors: string[];
  @Input() public pendingMode = false;
  @Input() public powerBars: PowerBar[] = [];
  @Input() public selected: boolean;
  @Input() public defaultSelection: string[];
  @Output() public rowSelected = new EventEmitter();


  public constructor() { }

  public ngOnInit(): void {
    const isSelected = this.defaultSelection && this.defaultSelection.find( term =>
      term.toLowerCase().trim() === this.multiBarRowData.term.toLowerCase().trim());
    if(isSelected){
      this.selected = true;
      this.rowSelected.emit(this.multiBarRowData.term);
    }
  }

  public selectRow() {
    this.selected = !this.selected;
    this.rowSelected.emit(this.multiBarRowData.term);
  }


  public onCheck() {
    this.selected = !this.selected;
    this.rowSelected.emit(this.multiBarRowData.term);
  }

  /** TODO : the selection state should be saved an propagated to the parent component.
   */
}
