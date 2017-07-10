import { Component, OnInit, Input, Output } from '@angular/core';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'arlas-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
})

export class TableComponent implements OnInit {
  @Input() settings;
  @Input() dataSubject: Subject<Object> = new Subject<Object>();
  @Input() source: Object;
  @Output() valuesChangedEvent: Subject<any> = new Subject<any>();

  constructor() { }

  ngOnInit() {
  }

}
