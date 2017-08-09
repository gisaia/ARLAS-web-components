import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { DateUnit, DataType, ChartType, HistogramData, SelectedOutputValues,
  SelectedInputValues } from '../../components/histogram/histogram.utils';
import * as d3 from 'd3';


@Component({
  selector: 'arlas-histogram-demo',
  templateUrl: './histogram-demo.component.html',
  styleUrls: ['./histogram-demo.component.css']
})
export class HistogramDemoComponent implements OnInit {
  public curvedTimelineData: Subject<Array<HistogramData>> = new Subject<Array<HistogramData>>();
  public barsHistogramData: Subject<Array<HistogramData>> = new Subject<Array<HistogramData>>();
  public defaultHistogramData: Subject<Array<HistogramData>> = new Subject<Array<HistogramData>>();
  public dateUnit = DateUnit;
  public dataType = DataType;
  public chartType = ChartType;
  public selectedTimeValues: SelectedOutputValues = {startvalue: null, endvalue: null};
  public selectedNumericValues: SelectedOutputValues = {startvalue: null, endvalue: null};
  public selectValues: Subject<SelectedInputValues> = new Subject<SelectedInputValues>();

  constructor() { }

  public ngOnInit() {
    this.showData();
  }

  public setSelectedTimeValues(selectedValues: {startvalue: Date, endvalue: Date}) {
    this.selectedTimeValues.startvalue  = selectedValues.startvalue;
    this.selectedTimeValues.endvalue = selectedValues.endvalue;
  }

  public setSelectedNUmericValues(selectedValues: {startvalue: number, endvalue: number}) {
    this.selectedNumericValues.startvalue  = selectedValues.startvalue;
    this.selectedNumericValues.endvalue = selectedValues.endvalue;
  }

  private showData() {
    this.showDefaultGraph(this);
    this.showCurvedTimeline(this);
    this.showBarsHistogram(this);

  }

  private setSelectedValues(component: HistogramDemoComponent, start, end) {
    const selectInputValues = {startvalue: start, endvalue: end};
    component.selectValues.next(selectInputValues);
  }
  private showDefaultGraph(component: HistogramDemoComponent) {
    d3.csv('assets/sp503.csv', this.stringToNumber, function(error, data) {
          if (error) { throw error; }
          component.defaultHistogramData.next(data);
    });
  }

  private showCurvedTimeline(component: HistogramDemoComponent) {
    d3.csv('assets/sp500.csv', this.stringToNumber, function(error, data) {
          if (error) { throw error; }
          component.curvedTimelineData.next(data);
    });
  }

  private showBarsHistogram(component: HistogramDemoComponent) {
    const _thisComponent = this;
    d3.csv('assets/sp501.csv', this.stringToNumber, function(error, data) {
          if (error) { throw error; }
          _thisComponent.barsHistogramData.next(data);
          _thisComponent.setSelectedValues(_thisComponent , 1992 , 2060);
    });

  }

  private sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
  }

  private stringToNumber(d) {
          d.value = +d.value;
          return d;
  }





}
