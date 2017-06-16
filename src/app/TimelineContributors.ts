import { Observable } from 'rxjs/Observable';
import { TimelineComponent } from './timeline/timeline.component';

export class TimelineContributor {


    constructor(private timeline: TimelineComponent) {
      console.log('New TimelineContributor');
    }

    observeDataChangement(obs: Observable<any>) {
      return obs.subscribe(value => {
        console.log('BRUSHED ' + value);
        // this.plotData(null, null, null);
      });
    }

    plotData(data: Array<any>, startDate: any, endDate: any) {
      this.timeline.plot(data, startDate, endDate);
    }
}
