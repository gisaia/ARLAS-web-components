import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'arlas-gauge-demo',
  templateUrl: './gauge-demo.component.html',
  styleUrls: ['./gauge-demo.component.css']
})
export class GaugeDemoComponent implements OnInit {

  public maxValue = 1e10;
  public threshold = 1e8;
  public currentValue = 1e5;

  constructor() { }

  public ngOnInit() {
    this.maxValue = this.generateRandomInteger(1e9, 1e10);
    this.threshold = this.generateRandomInteger(1e6, 1e8);
    this.currentValue = this.generateRandomInteger(1e3, 1e5);
  }


  public updateData() {
    this.maxValue = this.generateRandomInteger(1e9, 1e10);
    this.threshold = this.generateRandomInteger(1e6, 1e8);
    this.currentValue = this.generateRandomInteger(1e3, 1e5);

  }

  public generateRandomInteger(min, max) {
    return Math.floor(min + Math.random() * (max + 1 - min));
  }

}
