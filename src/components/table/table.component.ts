import { Component, OnInit, Input, Output } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { DataSource } from 'ng2-smart-table/lib/data-source/data-source';
import { LocalDataSource } from 'ng2-smart-table';
import { element } from 'protractor';

@Component({
  selector: 'arlas-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
})

export class TableComponent implements OnInit {
  @Input() public settings: Object;
  @Input() public dataSubject: Subject<any> = new Subject<any>();
  @Input() public source: DataSource;
  @Output() public valuesChangedEvent: Subject<any> = new Subject<any>();
  constructor() {
    this.dataSubject.subscribe(value => {
      this.source = new LocalDataSource();
      this.source.load(value.data);
      this.settings = value.settings;
    });
  }
  public ngOnInit() {
  }

  public rowSelect(data) {
    const dataArray = new Array<Object>();
    if (data.source.filterConf.filters.length > 0) {
      data.source.filterConf.filters.forEach(e => {
        if (e.field !== '' && e.search !== '') {
          dataArray.push({
            field: e.field,
            value: e.search
          });
        }
      });
      this.valuesChangedEvent.next(dataArray);
    }

  }
}
