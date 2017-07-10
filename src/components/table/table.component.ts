import { Component, OnInit, Input, Output } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { DataSource } from "ng2-smart-table/lib/data-source/data-source";
import { LocalDataSource } from "ng2-smart-table";

@Component({
  selector: 'arlas-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
})

export class TableComponent implements OnInit {
  @Input() settings:Object;
  @Input() dataSubject: Subject<any> = new Subject<any>();
  @Input() source: DataSource;
  @Output() valuesChangedEvent: Subject<any> = new Subject<any>();

  constructor() { 

    this.dataSubject.subscribe(value=>{
      this.source = new LocalDataSource()
      this.source.load(value)
    })
  }

  ngOnInit() {
  }

}
