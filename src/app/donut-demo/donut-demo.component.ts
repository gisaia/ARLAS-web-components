import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { setTimeout } from 'timers';


@Component({
  selector: 'arlas-donut-demo',
  templateUrl: './donut-demo.component.html',
  styleUrls: ['./donut-demo.component.css']
})
export class DonutDemoComponent implements OnInit {

  public donutData = null;
  public selectedNodes;

  constructor() { }

  public ngOnInit() {
    this.donutData = {
      name: 'root',
      ringName: 'root',
      children : [
        {
          name: 'sentinelle',
          ringName: 'satellites',
          children : [
            {
              name: 'sentinelle1',
              ringName: 'mission',
              size: 100
            },
            {
              name: 'sentinelle2',
              ringName: 'mission',
              size: 130
            }
          ]
        },
        {
          name: 'SPOT',
          ringName: 'satellites',
          children : [
            {
              name: 'SPOT5',
              ringName: 'mission',
              size: 30
            },
            {
              name: 'SPOT6',
              ringName: 'mission',
              children : [
                {
                  name: 'FR1',
                  ringName: 'emetteur',
                  size: 10
                },
                {
                  name: 'FR2',
                  ringName: 'emetteur',
                  size: 130
                }
              ]
            },
            {
              name: 'SPOT7',
              ringName: 'mission',
              children : [
                {
                  name: 'FR1',
                  ringName: 'emetteur',
                  size: 20
                },
                {
                  name: 'FR2',
                  ringName: 'emetteur',
                  size: 110
                },
                {
                  name: 'FR3',
                  ringName: 'emetteur',
                  size: 110
                }
              ]
            }
          ]
        }

      ]
    };

    setTimeout(() => {
      this.selectedNodes = [[{ringName: 'mission', name: 'SPOT5'}, {ringName: 'satellites', name: 'SPOT'}]];
    }, 3000);


  }

}
