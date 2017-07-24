import { Component, ViewEncapsulation, OnInit, Input, Output } from '@angular/core';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'arlas-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class SearchComponent implements OnInit {
  @Output() valuesChangedEvent: Subject<any> = new Subject<any>();

  ngOnInit(): void {

  }

  runSearch(value: any) {
    this.valuesChangedEvent.next(value.search);
  }
}
