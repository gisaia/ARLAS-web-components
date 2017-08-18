import { Component, OnInit, Input } from '@angular/core';
import { RowItem } from '../utils/rowItem';

@Component({
  selector: '[arlas-result-item]',
  templateUrl: './result-item.component.html',
  styleUrls: ['./result-item.component.css']
})
export class ResultItemComponent implements OnInit {

  @Input() public rowItem: RowItem;

  private identifier: string;

  constructor() { }

  public ngOnInit() {
  }

}
