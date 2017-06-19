import { Observable } from 'rxjs/Observable';
import { TimelineComponent } from './timeline/timeline.component';

export class TimelineContributor {


    constructor(private timeline: TimelineComponent) {
      console.log('New TimelineContributor');
    }

    observeDataChangement(obs: Observable<any>) {
      return obs.subscribe(value => {
        console.log('BRUSHED ' + value.startdate + ' ' + value.enddate);
        // set period of collaborative seach service
      });
    }

    plotData(data: Array<any>, startDate: any, endDate: any) {
      // this.timeline.plotTimelineAsCurve(data, null, endDate);
    }
}
