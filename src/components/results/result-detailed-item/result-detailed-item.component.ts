import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'arlas-result-detailed-item',
  templateUrl: './result-detailed-item.component.html',
  styleUrls: ['./result-detailed-item.component.css']
})
export class ResultDetailedItemComponent implements OnInit {

  // Set of detailed informations about the item
  @Input() public detailedItemInformations: Array<{fieldName: string, fieldValue: string | number | Date }>;

  // Actions list : View, Show on map, Download ...
  @Input() public actionsList: Array<string>;

  constructor() { }

  public ngOnInit() {
  }

}
