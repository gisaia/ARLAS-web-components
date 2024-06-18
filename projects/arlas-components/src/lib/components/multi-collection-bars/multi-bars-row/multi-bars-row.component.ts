import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MultiBarRow } from '../multi-collection-bars.component';
import { PowerBar } from '../../powerbars/model/powerbar';
import { NgClass, NgForOf, NgIf, UpperCasePipe } from '@angular/common';
import { PowerbarModule } from '../../powerbars/powerbar/powerbar.module';

@Component({
  selector: 'arlas-multi-bars-row',
  templateUrl: './multi-bars-row.component.html',
  styleUrls: ['./multi-bars-row.component.scss'],
  imports: [
    MatCheckboxModule,
    NgClass,
    PowerbarModule,
    UpperCasePipe,
    NgIf,
    NgForOf
  ],
  standalone: true
})
export class MultiBarsRowComponent implements OnInit {
  @Input() public displayCheckBox: boolean;
  @Input() public multiBarRowData: MultiBarRow;
  @Input() public colors: string[];
  @Input() public pendingMode = false;
  @Input() public powerBars: PowerBar[] = [];
  @Output() public rowSelected = new EventEmitter();

  public selected: boolean;
  public constructor() { }

  public ngOnInit(): void {
  }

  public selectRow() {
    this.selected = !this.selected;
    this.rowSelected.emit(this.multiBarRowData.header);
  }


  public  onCheck() {
    this.selected = !this.selected;
    this.rowSelected.emit(this.multiBarRowData.header);
  }
}
