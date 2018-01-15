import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';


@Component({
  selector: 'arlas-donut-demo',
  templateUrl: './donut-demo.component.html',
  styleUrls: ['./donut-demo.component.css']
})
export class DonutDemoComponent implements OnInit {

  public donutData = null;

  constructor() { }

  public ngOnInit() {
    function buildHierarchy(csv) {
      const root = {'name': 'root', 'children': []};
      for (let i = 0; i < csv.length; i++) {
        const sequence = csv[i][0];
        const size = +csv[i][1];
        if (isNaN(size)) { // e.g. if this is a header row
          continue;
        }
        const parts = sequence.split('-');
        let currentNode = root;
        for (let j = 0; j < parts.length; j++) {
          const children = currentNode['children'];
          const nodeName = parts[j];
          let childNode;
          if (j + 1 < parts.length) {
       // Not yet at the end of the sequence; move down the tree.
       let foundChild = false;
       for (let k = 0; k < children.length; k++) {
         if (children[k]['name'] === nodeName) {
           childNode = children[k];
           foundChild = true;
           break;
         }
       }
      // If we don't already have a child node for this branch, create it.
       if (!foundChild) {
         childNode = {'name': nodeName, 'children': []};
         children.push(childNode);
       }
       currentNode = childNode;
          } else {
       // Reached the end of the sequence; create a leaf node.
       childNode = {'name': nodeName, 'size': size};
       children.push(childNode);
          }
        }
      }
      return root;
    }
    d3.text('assets/visit-sequences.csv', (text) => {
      const csv = d3.csvParseRows(text);
      // this.donutData = buildHierarchy(csv);
      this.donutData = {
        name: 'root',
        children : [
          {
            name: 'sentinelle',
            children : [
              {
                name: 'sentinelle1',
                size: 10
              },
              {
                name: 'sentinelle2',
                size: 130
              }
            ]
          },
          {
            name: 'SPOT',
            children : [
              {
                name: 'SPOT5',
                size: 30
              },
              {
                name: 'SPOT6',
                size: 50
              },
              {
                name: 'SPOT7',
                size: 60
              }
            ]
          }

        ]
      }

    });
  }

}
