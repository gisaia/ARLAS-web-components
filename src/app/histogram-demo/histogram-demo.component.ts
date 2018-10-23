import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { DataType, ChartType, SelectedOutputValues, SelectedInputValues, SwimlaneMode } from 'arlas-d3';


@Component({
  selector: 'arlas-histogram-demo',
  templateUrl: './histogram-demo.component.html',
  styleUrls: ['./histogram-demo.component.css']
})
export class HistogramDemoComponent implements OnInit {
  public curvedTimelineData: Array<{key: Date | number, value: number}>;
  public barsHistogramData: Array<Array<{key: Date | number, value: number}>>;
  public oneDimensionHistogramData: Array<Array<{key: Date | number, value: number}>>;
  public defaultHistogramData: Array<Array<{key: Date | number, value: number}>>;
  public swimlaneHistogramData: Map<any, any>;
  public dataType = DataType;
  public swimlaneMode = SwimlaneMode;
  public chartType = ChartType;
  public selectedTimeValues: SelectedOutputValues = { startvalue: null, endvalue: null };
  public selectedNumericValues: SelectedOutputValues = { startvalue: null, endvalue: null };
  public selectValues: SelectedInputValues;
  public selectValuesSwimlane: SelectedInputValues;
  public areaSelection: SelectedInputValues;
  public intervalListSelection: SelectedOutputValues[] = [];

  constructor() { }

  public ngOnInit() {
    this.showData();
  }

  public setSelectedTimeValues(selectedValues: Array<{ startvalue: Date, endvalue: Date }>) {
    this.selectedTimeValues.startvalue = selectedValues[0].startvalue;
    this.selectedTimeValues.endvalue = selectedValues[0].endvalue;
    if (selectedValues.length === 1) {
      this.intervalListSelection = [];
    } else {
      selectedValues.pop();
      this.intervalListSelection = selectedValues;
    }
  }

  public setSelectedNumericValues(selectedValues: Array<{ startvalue: Date, endvalue: Date }>) {
    this.selectedNumericValues.startvalue = selectedValues[0].startvalue;
    this.selectedNumericValues.endvalue = selectedValues[0].endvalue;

  }

  private showData() {

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
