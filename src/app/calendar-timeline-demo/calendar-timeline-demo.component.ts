import { Component, OnInit } from '@angular/core';
import { Granularity } from 'arlas-d3';
import { Subject } from 'rxjs';

@Component({
  selector: 'arlas-calendar-timeline-demo',
  templateUrl: './calendar-timeline-demo.component.html',
  styleUrls: ['./calendar-timeline-demo.component.css']
})
export class CalendarTimelineDemoComponent implements OnInit {
  public granularity: Subject<Granularity> = new Subject();

  public constructor() { }

  public ngOnInit(): void {
  }

  public day() {
    this.granularity.next(Granularity.day);
  }


  public month() {
    this.granularity.next(Granularity.month);
  }

}
