import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'arlas-result-item',
  templateUrl: './result-item.component.html',
  styleUrls: ['./result-item.component.css']
})
export class ResultItemComponent implements OnInit {

  // itemContent is a fieldName-fieldValue map
  @Input() public itemContent: Map<string, string | number | Date>;

  private identifier: string;

  constructor() { }

  public ngOnInit() {
  }

}
