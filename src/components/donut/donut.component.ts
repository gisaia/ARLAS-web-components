import {
  Component, OnInit, OnChanges, Input, Output, SimpleChanges, ViewContainerRef, ElementRef, ViewEncapsulation
} from '@angular/core';
import { Subject, fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { AbstractDonut, OneSelectionDonut, MultiSelectionDonut, DonutParams, TreeNode, SimpleNode } from 'arlas-d3';
import * as donutJsonSchema from './donut.schema.json';
import { ColorGeneratorImpl } from './donut.utils';

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
  @Input() public donutData: TreeNode;

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
  @Input() public selectedArcsList: Array<Array<SimpleNode>> = new Array<Array<SimpleNode>>();

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
   * @Input : Angular
   * @description List of [key, color] couples that associates a hex color to each key
   */
  @Input() public keysToColors: Array<Array<string>>;

  /**
   * @Input : Angular
   * @description The percentage of highest values in saturation scale. For exemple, colorsSaturationWeight = 1/5,  means
   * that colors saturation values will be between 0.8 and 1. Knowing that saturation scale is [0 - 1].
   */
  @Input() public colorsSaturationWeight = 1 / 2 ;

  /**
   * @Output : Angular
   * @description Emits the list of selected nodes and the paths to their ultimate parent
   */
  @Output() public selectedNodesEvent: Subject<Array<Array<SimpleNode>>> = new Subject<Array<Array<SimpleNode>>>();

  /**
   * @Output : Angular
   * @description Emits the hovered node and the path to it's parents.
   * The key of the map is the node's name and the value is its color on the donut
   */
  @Output() public hoveredNodesEvent: Subject<Map<string, string>> = new Subject<Map<string, string>>();


  public donut: AbstractDonut;
  private donutColorizer: ColorGeneratorImpl;

  constructor(private viewContainerRef: ViewContainerRef, private el: ElementRef) {
    fromEvent(window, 'resize')
      .pipe(debounceTime(500))
      .subscribe((event: Event) => {
        this.donut.resize(this.el.nativeElement.childNodes[0]);
      });
  }

  public ngOnInit() { }

  public ngOnChanges(changes: SimpleChanges): void {
    if (this.donut === undefined) {
      if (this.multiselectable) {
        this.donut = new MultiSelectionDonut();
      } else {
        this.donut = new OneSelectionDonut();
      }
      this.setDonutColorizer();
      this.setDonutParameters();
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

  private setDonutParameters(): void {
    this.donut.donutParams = new DonutParams();
    this.donut.donutParams.id = this.id;
    this.donut.donutParams.customizedCssClass = this.customizedCssClass;
    this.donut.donutParams.donutData = this.donutData;
    this.donut.donutParams.hoveredNodesEvent = this.hoveredNodesEvent;
    this.donut.donutParams.multiselectable = this.multiselectable;
    this.donut.donutParams.opacity = this.opacity;
    this.donut.donutParams.selectedArcsList = this.selectedArcsList;
    this.donut.donutParams.selectedNodesEvent = this.selectedNodesEvent;
    this.donut.donutParams.donutContainer = this.el.nativeElement.childNodes[0];
    this.donut.donutParams.svgElement = this.el.nativeElement.childNodes[0].childNodes[0];
    this.donut.donutParams.donutNodeColorizer = this.donutColorizer;
  }

  private setDonutColorizer(): void {
      if (this.keysToColors) {
        this.donutColorizer = new ColorGeneratorImpl();
        this.donutColorizer.keysToColors = this.keysToColors;
        this.donutColorizer.saturationWeight = this.colorsSaturationWeight;
      }
  }
}
