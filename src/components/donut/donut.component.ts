import {
  Component, OnInit, OnChanges, Input, Output, SimpleChanges, ViewContainerRef, ElementRef, ViewEncapsulation
} from '@angular/core';
import { Observable, Subject } from 'rxjs/Rx';
import * as d3 from 'd3';
import { DonutDimensions, DonutArc, DonutUtils, DonutNode } from 'arlas-d3';
import { AbstractDonut } from 'arlas-d3';
import * as donutJsonSchema from './donut.schema.json';
import { DonutParams } from 'arlas-d3';
import { MultiSelectionDonut } from 'arlas-d3';
import { OneSelectionDonut } from 'arlas-d3';


@Component({
  selector: 'arlas-donut',
  templateUrl: './donut.component.html',
  styleUrls: ['./donut.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DonutComponent implements OnInit, OnChanges {
  /**
   * @Input : Angular
   * @description Data tree to plot in the donut.
   */
  @Input() public donutData: DonutArc;

  /**
   * @Input : Angular
   * @description Sets the opacity of non-hovered or non-selected nodes.
   */
  @Input() public opacity = 0.4;

  /**
   * @Input : Angular
   * @description Css class name to use to customize a specific powerbar's style.
   */
  @Input() public customizedCssClass;

  /**
   * @Input : Angular
   * @description List of selected nodes.
   */
  @Input() public selectedArcsList: Array<Array<{ ringName: string, name: string }>> =
    new Array<Array<{ ringName: string, name: string }>>();

  /**
   * @Input : Angular
   * @description Whether the donut is multi-selectable.
   */
  @Input() public multiselectable = true;

  /**
   * @Input : Angular
   * @description id of the donut
   */
  @Input() public id;

  /**
   * @Output : Angular
   * @description Emits the list of selected nodes and the paths to their ultimate parent
   */
  @Output() public selectedNodesEvent: Subject<Array<Array<{ ringName: string, name: string }>>> =
    new Subject<Array<Array<{ ringName: string, name: string }>>>();

  /**
   * @Output : Angular
   * @description Emits the hovered node and the path to it's parents.
   * The key of the map is the node's name and the value is its color on the donut
   */
  @Output() public hoveredNodesEvent: Subject<Map<string, string>> = new Subject<Map<string, string>>();


  public donut: AbstractDonut;

  constructor(private viewContainerRef: ViewContainerRef, private el: ElementRef) {
    Observable.fromEvent(window, 'resize')
      .debounceTime(500)
      .subscribe((event: Event) => { this.donut.resizeDonut(event); });
  }

  public ngOnInit() { }

  public ngOnChanges(changes: SimpleChanges): void {
    if (this.donut !== undefined) {
      this.donut.donutParams.donutContainer = this.el.nativeElement.childNodes[0];
      this.donut.donutParams.svgElement = this.el.nativeElement.childNodes[0].childNodes[1];
    } else {
      if (this.multiselectable) {
        this.donut = new MultiSelectionDonut();
      } else {
        this.donut = new OneSelectionDonut();
      }
      this.setDonutParameters();
      this.donut.donutParams.donutContainer = this.el.nativeElement.childNodes[0];
      this.donut.donutParams.svgElement = this.el.nativeElement.childNodes[0].childNodes[1];
    }

    if (changes.donutData && this.donutData !== undefined && this.donutData !== null && this.donut !== undefined
      && this.donut.donutParams !== undefined) {
      this.donut.dataChange(this.donutData);
    }

    if (changes.selectedArcsList && this.selectedArcsList !== undefined && this.selectedArcsList !== null && this.donut !== undefined
      && this.donut.donutParams !== undefined && this.donut.donutParams.donutNodes !== undefined) {
      this.donut.onSelectionChange(this.selectedArcsList);
    }
  }

  /**
   * @returns Json schema of the donut component for configuration
   */
  public static getDonutJsonSchema(): Object {
    return donutJsonSchema;
  }


  private setDonutParameters() {
    this.donut.donutParams = new DonutParams();
    this.donut.donutParams.id = this.id;
    this.donut.donutParams.customizedCssClass = this.customizedCssClass;
    this.donut.donutParams.donutData = this.donutData;
    this.donut.donutParams.hoveredNodesEvent = this.hoveredNodesEvent;
    this.donut.donutParams.multiselectable = this.multiselectable;
    this.donut.donutParams.opacity = this.opacity;
    this.donut.donutParams.selectedArcsList = this.selectedArcsList;
    this.donut.donutParams.selectedNodesEvent = this.selectedNodesEvent;
  }
}
