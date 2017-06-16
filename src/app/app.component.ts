import { Component, AfterViewInit, OnInit, ViewChild } from '@angular/core';
import { TimelineContributor } from './TimelineContributors';
import { TimelineComponent } from './timeline/timeline.component';


@Component({
  selector: 'gisaia-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {

  timelineContributor: TimelineContributor;
  @ViewChild(TimelineComponent) timelineComponent: TimelineComponent;

  ngAfterViewInit(): void {
    this.timelineContributor = new TimelineContributor(this.timelineComponent);
    this.timelineContributor.observeDataChangement(this.timelineComponent.dateChangedEvent);
  }
}
