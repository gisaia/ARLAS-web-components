import { Component, ViewEncapsulation, OnInit, Input, Output } from '@angular/core';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'arlas-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class SearchComponent implements OnInit {
  @Output() public valuesChangedEvent: Subject<any> = new Subject<any>();

  public ngOnInit(): void {

  }

  public runSearch(form: any) {
    this.valuesChangedEvent.next(form.value.search);
    form.reset();
  }
}
