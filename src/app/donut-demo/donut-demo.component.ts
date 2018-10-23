import { Component, OnInit } from '@angular/core';

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
      size: 640,
      children : [
        {
          name: 'sentinelle',
          ringName: 'satellites',
          size: 230,
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
          size: 170,
          children : [
            {
              name: 'SPOT5',
              ringName: 'mission',
              size: 30
            },
            {
              name: 'SPOT6',
              size: 140,
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
              size: 240,
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
      // this.selectedNodes = [[{ringName: 'mission', name: 'SPOT5'}, {ringName: 'satellites', name: 'SPOT'}]];
      this.donutData = {
        name: 'root',
        ringName: 'root',
        size: 530,
        children : [
          {
            name: 'sentinelle',
            ringName: 'satellites',
            size: 230,
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
            size: 300,
            ringName: 'satellites',
            children : [
              {
                name: 'SPOT5',
                ringName: 'mission',
                size: 30
              },
              {
                name: 'SPOT6',
                size: 140,
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
                size: 130,
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
                    size: 50
                  },
                  {
                    name: 'FR3',
                    ringName: 'emetteur',
                    size: 60
                  }
                ]
              }
            ]
          }

        ]
      };
    }, 3000);


  }

}
