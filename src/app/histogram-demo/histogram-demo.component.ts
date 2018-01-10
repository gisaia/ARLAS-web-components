import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import {
  DateUnit, DataType, ChartType, HistogramData, SelectedOutputValues,
  SelectedInputValues, SwimlaneData, SwimlaneMode
} from '../../components/histogram/histogram.utils';
import * as d3 from 'd3';
import { setTimeout } from 'timers';


@Component({
  selector: 'arlas-histogram-demo',
  templateUrl: './histogram-demo.component.html',
  styleUrls: ['./histogram-demo.component.css']
})
export class HistogramDemoComponent implements OnInit {
  public curvedTimelineData: Array<HistogramData>;
  public barsHistogramData: Array<HistogramData>;
  public oneDimensionHistogramData: Array<HistogramData>;
  public defaultHistogramData: Array<HistogramData>;
  public swimlaneHistogramData: Map<any, any>;
  public dateUnit = DateUnit;
  public dataType = DataType;
  public swimlaneMode = SwimlaneMode;
  public chartType = ChartType;
  public selectedTimeValues: SelectedOutputValues = { startvalue: null, endvalue: null };
  public selectedNumericValues: SelectedOutputValues = { startvalue: null, endvalue: null };
  public selectValues: SelectedInputValues;
  public selectValuesSwimlane: SelectedInputValues;
  public areaSelection: SelectedInputValues;
  public intervalListSelection4: SelectedOutputValues[] = [];
  public intervalListSelection3: SelectedOutputValues[] = [];
  public intervalListSelection2: SelectedOutputValues[] = [];
  public intervalListSelection1: SelectedOutputValues[] = [];


  constructor() { }

  public ngOnInit() {
    this.showData();
  }

  public setSelectedTimeValues(selectedValues: Array<{ startvalue: Date, endvalue: Date }>) {
    this.selectedTimeValues.startvalue = selectedValues[0].startvalue;
    this.selectedTimeValues.endvalue = selectedValues[0].endvalue;
    if (selectedValues.length === 1) {
      this.intervalListSelection4 = [];
    } else {
      selectedValues.pop();
      this.intervalListSelection4 = selectedValues;
    }

  }

  public setSelectedNumericValues(selectedValues: Array<{ startvalue: Date, endvalue: Date }>) {
    this.selectedNumericValues.startvalue = selectedValues[0].startvalue;
    this.selectedNumericValues.endvalue = selectedValues[0].endvalue;

  }

  public valueChanged1(event) {
    if (event.length === 1) {
      this.intervalListSelection1 = [];
    } else {
      event.pop();
      this.intervalListSelection1 = event;
    }

  }
  public valueChanged2(event) {
    if (event.length === 1) {
      this.intervalListSelection2 = [];
    } else {
      event.pop();
      this.intervalListSelection2 = event;
    }

  }
  public valueChanged3(event) {
    if (event.length === 1) {
      this.intervalListSelection2 = [];
    } else {
      event.pop();
      this.intervalListSelection2 = event;
    }
  }

  private showData() {
    this.showDefaultGraph(this);
    this.showCurvedTimeline(this);
    this.showBarsHistogram(this);
    this.showOneDimensionHistogram(this);
    this.showSwimlaneHistogram(this);

  }



  private setSelectedValues(component: HistogramDemoComponent, start, end) {
    const selectInputValues = { startvalue: start, endvalue: end };
    component.selectValues = selectInputValues;
  }
  private showDefaultGraph(component: HistogramDemoComponent) {
    d3.csv('assets/sp503.csv', this.stringToNumber, function (error, data) {
      if (error) { throw error; }
      component.defaultHistogramData = data;
    });
  }

  private showCurvedTimeline(component: HistogramDemoComponent) {
    component.curvedTimelineData = [];
    d3.csv('assets/sp500.csv', this.stringToNumber, function (error, data) {
      if (error) { throw error; }
      component.curvedTimelineData = [];
      setTimeout(() => {
        component.curvedTimelineData = data;
      }, 3000);
    });
  }

  private showBarsHistogram(component: HistogramDemoComponent) {
    const _thisComponent = this;
    d3.csv('assets/sp501.csv', this.stringToNumber, function (error, data) {
      if (error) { throw error; }
      _thisComponent.barsHistogramData = data;
      _thisComponent.setSelectedValues(_thisComponent, 1992, 2060);
    });

  }

  private showOneDimensionHistogram(component: HistogramDemoComponent) {
    const _thisComponent = this;
    d3.csv('assets/sp501.csv', this.oneToZero, function (error, data) {
      if (error) { throw error; }
      _thisComponent.oneDimensionHistogramData = data;
      _thisComponent.setSelectedValues(_thisComponent, 1992, 2060);
    });

  }

  private showSwimlaneHistogram(component: HistogramDemoComponent) {
    d3.csv('assets/swimlane.csv', this.stringToNumber, (error, data) => {
      if (error) { throw error; }
      d3.csv('assets/swimlane2.csv', this.stringToNumber, (error, data2) => {
        if (error) { throw error; }
        this.swimlaneHistogramData = new Map<any, any>();
        this.swimlaneHistogramData.set('line1', data);
        this.selectValuesSwimlane = undefined;
        setTimeout(() => {
          this.swimlaneHistogramData = new Map<any, any>();
          this.swimlaneHistogramData.set('line1', data);
          this.swimlaneHistogramData.set('line2', data2);
          this.swimlaneHistogramData.set('line3', data2);
          setTimeout(() => {
            this.selectValuesSwimlane = { startvalue: 1513262121, endvalue: 1665262121 };
          }, 5000);
        }, 5000);

      });
    });
  }


  private sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private stringToNumber(d) {
    d.value = +d.value;
    return d;
  }

  private oneToZero(d) {
    d.value = +d.value / 1450;
    return d;
  }





}
