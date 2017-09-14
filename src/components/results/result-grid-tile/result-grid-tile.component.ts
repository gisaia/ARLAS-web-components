import { Component, OnInit, Input, Output } from '@angular/core';
import { GridTile } from '../model/gridTile';
import { ItemComponent } from '../model/itemComponent';

import { ModeEnum } from '../utils/enumerations/modeEnum';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';



@Component({
  selector: 'arlas-result-grid-tile',
  templateUrl: './result-grid-tile.component.html',
  styleUrls: ['./result-grid-tile.component.css']
})
export class ResultGridTileComponent extends ItemComponent implements OnInit {

  @Input() public gridTile: GridTile;
  @Input() public selectedItems: Array<string>;
  @Input() public lastChangedCheckBoxEvent: Subject<{identifier: string, mode: ModeEnum}> =
   new Subject<{identifier: string, mode: ModeEnum}>();

  @Output() public selectedItemsEvent: Subject<Array<string>> = new Subject<Array<string>>();
  @Output() public changedCheckBoxEvent: Subject<{identifier: string, mode: ModeEnum}> =
   new Subject<{identifier: string, mode: ModeEnum}>();

  constructor() {
    super();
  }

  public ngOnInit() {
    this.lastChangedCheckBoxEvent.subscribe((item: {identifier: string, mode: ModeEnum}) => {
      if (item != null && item.mode === ModeEnum.list && item.identifier === this.gridTile.id) {
        this.isChecked = !this.isChecked;
      }
    });
  }

  // Update the list of the selected items
  public setSelectedItem() {
    super.setSelectedItem(this.gridTile.id, this.selectedItems);
    // Emit to the result list the fact that this checkbox has changed in order to notify the correspondant one in list mode
    this.changedCheckBoxEvent.next({identifier: this.gridTile.id, mode: ModeEnum.grid});
    this.selectedItemsEvent.next(this.selectedItems);
  }
}
