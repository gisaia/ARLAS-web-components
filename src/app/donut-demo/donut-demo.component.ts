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
      fieldValue: 'root',
      fieldName: 'root',
      size: 400,
      children : [
        {
          fieldValue: 'sentinelle',
          fieldName: 'satellites',
          size: 230,
          children : [
            {
              fieldValue: 'sentinelle1',
              fieldName: 'mission',
              size: 100
            },
            {
              fieldValue: 'sentinelle2',
              fieldName: 'mission',
              size: 130
            }
          ]
        },
        {
          fieldValue: 'SPOT',
          fieldName: 'satellites',
          size: 170,
          children : [
            {
              fieldValue: 'SPOT5',
              fieldName: 'mission',
              size: 30
            },
            {
              fieldValue: 'SPOT6',
              size: 140,
              fieldName: 'mission',
              children : [
                {
                  fieldValue: 'FR1',
                  fieldName: 'emetteur',
                  size: 10
                },
                {
                  fieldValue: 'FR2',
                  fieldName: 'emetteur',
                  size: 130
                }
              ]
            },
            {
              fieldValue: 'SPOT7',
              fieldName: 'mission',
              size: 240,
              children : [
                {
                  fieldValue: 'FR1',
                  fieldName: 'emetteur',
                  size: 20
                },
                {
                  fieldValue: 'FR2',
                  fieldName: 'emetteur',
                  size: 110
                },
                {
                  fieldValue: 'FR3',
                  fieldName: 'emetteur',
                  size: 110
                }
              ]
            }
          ]
        }

      ]
    };

    setTimeout(() => {
      // this.selectedNodes = [[{fieldName: 'mission', fieldValue: 'SPOT5'}, {fieldName: 'satellites', fieldValue: 'SPOT'}]];
      this.donutData = {
        fieldName: 'root',
        fieldValue: 'root',
        size: 530,
        children : [
          {
            fieldValue: 'sentinelle',
            fieldName: 'satellites',
            size: 230,
            children : [
              {
                fieldValue: 'sentinelle1',
                fieldName: 'mission',
                size: 100
              },
              {
                fieldValue: 'sentinelle2',
                fieldName: 'mission',
                size: 130
              }
            ]
          },
          {
            fieldValue: 'SPOT',
            size: 300,
            fieldName: 'satellites',
            children : [
              {
                fieldValue: 'SPOT5',
                fieldName: 'mission',
                size: 30
              },
              {
                fieldValue: 'SPOT6',
                size: 140,
                fieldName: 'mission',
                children : [
                  {
                    fieldValue: 'FR1',
                    fieldName: 'emetteur',
                    size: 10
                  },
                  {
                    fieldValue: 'FR2',
                    fieldName: 'emetteur',
                    size: 130
                  }
                ]
              },
              {
                fieldValue: 'SPOT7',
                size: 130,
                fieldName: 'mission',
                children : [
                  {
                    fieldValue: 'FR1',
                    fieldName: 'emetteur',
                    size: 20
                  },
                  {
                    fieldValue: 'FR2',
                    fieldName: 'emetteur',
                    size: 50
                  },
                  {
                    fieldValue: 'FR3',
                    fieldName: 'emetteur',
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
