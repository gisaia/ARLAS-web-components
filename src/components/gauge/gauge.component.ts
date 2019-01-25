import { Component, SimpleChanges, Input, ViewEncapsulation, AfterViewInit } from '@angular/core';
import { OnChanges } from '@angular/core/core';
import { Gauge } from 'arlas-d3';
import { select } from 'd3-selection';

@Component({
  selector: 'arlas-gauge',
  templateUrl: './gauge.component.html',
  styleUrls: ['./gauge.component.css'],
  encapsulation: ViewEncapsulation.None

})
export class GaugeComponent implements AfterViewInit, OnChanges {
  /**
   * @Input : Angular
   * @description Gauge's width
   */
  @Input() public width = 20;
  /**
   * @Input : Angular
   * @description Gauge's height.
   */
  @Input() public height = 250;
  /**
   * @Input : Angular
   * @description Max value of the gauge.
   */
  @Input() public maxValue = 0;
  /**
   * @Input : Angular
   * @description Threshold of the gauge.
   */
  @Input() public threshold = 0;
  /**
   * @Input : Angular
   * @description Current value of the cursor.
   */
  @Input() public currentValue = 0;
  /**
   * @Input : Angular
   * @description Radius of the corner of the rectangle gauge.
   */
  @Input() public gaugeRadius = 5;
  /**
   * @Input : Angular
   * @description Margin of the main svg.
   */
  @Input() public margin = { top: 5, right: 5, bottom: 5, left: 5 };
  /**
   * @Input : Angular
   * @description Height of the cursor in pixel.
   */
  @Input() public cursorHeight = 10;
  /**
   * @Input : Angular
   * @description Radius of the corner of the rectangle cursor.
   */
  @Input() public cursorRadius = 2;
  /**
 * @Input : Angular
 * @description Position of the tooltip.
 */
  @Input() public toolTipPosition = 'after';
  /**
 * @Input : Angular
 * @description Position of the tooltip.
 */
  @Input() public toolTipContent = 'Content of the toolTip';
  public gauge: Gauge;
  public svgElement: any;

  constructor() {

  }

  public ngAfterViewInit(): void {
    this.gauge = new Gauge(this.width, this.height);
    this.svgElement = document.getElementById('gauge-svg');
    this.gauge.plot(this.maxValue, this.threshold, this.currentValue, select(this.svgElement));
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (this.gauge) {
      if (changes) {
        this.gauge.plot(this.maxValue, this.threshold, this.currentValue, select(this.svgElement));
      }
    }
  }

}
