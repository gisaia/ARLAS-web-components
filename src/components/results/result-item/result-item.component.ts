import { Component, OnInit, Input, Output } from '@angular/core';
import { RowItem } from '../model/rowItem';
import { ItemComponent } from '../model/itemComponent';

import { ModeEnum } from '../utils/enumerations/modeEnum';
import { Action, ProductIdentifier } from '../utils/results.utils';
import { DetailedDataRetriever } from '../utils/detailed-data-retriever';

import { Observable } from 'rxjs/Rx';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';



@Component({
  selector: '[arlas-result-item]',
  templateUrl: './result-item.component.html',
  styleUrls: ['./result-item.component.css']
})
export class ResultItemComponent extends ItemComponent implements OnInit {

  @Input() public rowItem: RowItem;
  @Input() public detailedDataRetriever: DetailedDataRetriever;
  @Input() public selectedItems: Array<string>;
  @Input() public lastChangedCheckBoxEvent: Subject<{identifier: string, mode: ModeEnum}> =
   new Subject<{identifier: string, mode: ModeEnum}>();


  @Output() public selectedItemsEvent: Subject<Array<string>> = new Subject<Array<string>>();
  @Output() public borderStyleEvent: Subject<string> = new Subject<string>();
  @Output() public changeheckBoxEvent: Subject<{identifier: string, mode: ModeEnum}> =
   new Subject<{identifier: string, mode: ModeEnum}>();

  public isDetailToggled = false;
  public detailedData = '';
  public actions;
  public borderStyle = 'solid';
  private retrievedDataEvent: Observable<{ details: Map<string, Map<string, string>>, actions: Array<Action> }>;
  protected identifier: string;

  constructor() {
    super();
  }

  public ngOnInit() {
    this.identifier = (String)(this.rowItem.data.get(this.rowItem.columns[0].fieldName));
    this.rowItem.identifier = this.identifier;
    this.lastChangedCheckBoxEvent.subscribe((item: {identifier: string, mode: ModeEnum}) => {
      if (item != null && item.mode === ModeEnum.grid && item.identifier === this.identifier) {
        this.isChecked = !this.isChecked;
      }
    });
  }

  // Detailed data is retrieved wheb the row is toggled for the first time
  public toggle() {
    if (this.rowItem.isDetailToggled === false) {
      if (this.detailedDataRetriever !== null && this.rowItem.detailedData.length === 0) {
        this.retrievedDataEvent = this.detailedDataRetriever.getData(((String)(this.identifier)));
        this.retrievedDataEvent.subscribe(value => {
          this.rowItem.actions = value.actions;
          value.details.forEach((v, k) => {
            const details: Array<{ key: string, value: string }> = new Array<{ key: string, value: string }>();
            v.forEach((value, key) => details.push({ key: key, value: value }));
            this.rowItem.detailedData.push({ group: k, details: details });
          });
        });
      }
      this.borderStyle = 'dashed';
    } else {
      this.borderStyle = 'solid';
    }
    this.borderStyleEvent.next(this.borderStyle);
    this.rowItem.isDetailToggled = !this.rowItem.isDetailToggled;

  }

  // Update the list of the selected items
  public setSelectedItem() {
    super.setSelectedItem(this.identifier, this.selectedItems);
    // Emit to the result list the fact that this checkbox has changed in order to notify the correspondant one in grid mode
    this.changeheckBoxEvent.next({identifier: this.identifier, mode: ModeEnum.list});
    this.selectedItemsEvent.next(this.selectedItems);
  }


}
