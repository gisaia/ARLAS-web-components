import { Component, OnInit, OnChanges, Input, SimpleChanges, ViewContainerRef, ElementRef } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import * as d3 from 'd3';


import { DonutNode, getHexColorFromString, DonutDimensions, DonutData } from './donut.utils';
import { MarginModel } from '../histogram/histogram.utils';

@Component({
  selector: 'arlas-donut',
  templateUrl: './donut.component.html',
  styleUrls: ['./donut.component.css']
})
export class DonutComponent implements OnInit, OnChanges {
  /**
   * @Input
   * @description Data tree to plot in the donut.
   */
  @Input() public donutData: DonutData;

  public donutDimensions: DonutDimensions;


  private donutNodes: any;
  private donutContext: any;
  private svgNode: any;
  private margin: MarginModel = { top: 4, right: 10, bottom: 20, left: 60 };
  private arc: d3.Arc<any, d3.DefaultArcObject>;
  private x: d3.ScaleLinear<number, number>;
  private y: d3.ScalePower<number, number>;;

  constructor(private viewContainerRef: ViewContainerRef, private el: ElementRef) {
    Observable.fromEvent(window, 'resize')
      .debounceTime(500)
      .subscribe((event: Event) => {
        this.resizeDonut(event);
      });
  }

  public ngOnInit() {
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.svgNode = this.viewContainerRef.element.nativeElement;
    if (changes.donutData && this.donutData !== undefined && this.donutData !== null) {
      this.plot();
    }
  }

  private plot() {
    if (this.donutContext) {
      this.donutContext.remove();
    }
    this.initializeDonutDimensions();
    this.createDonutArcs();
    this.structureDataToNodes();
    this.plotDimensions();
  }

  private initializeDonutDimensions(): void {
    const margin = this.margin;
    const width = this.el.nativeElement.childNodes[0].offsetWidth;
    const height = this.el.nativeElement.childNodes[0].offsetHeight;
    const radius = Math.min(width, height) / 2;
    const svg = d3.select(this.svgNode).select('svg')
      .attr('width', width)
      .attr('height', height);
    this.donutDimensions = { svg, margin, width, height, radius };
  }

  private createDonutArcs() {
    this.x = d3.scaleLinear().range([0, 2 * Math.PI]);
    this.y = d3.scaleSqrt().range([0, this.donutDimensions.radius]);
    this.arc = d3.arc()
      .startAngle((d) => Math.max(0, Math.min(2 * Math.PI, this.x(d.startAngle))))
      .endAngle((d) => Math.max(0, Math.min(2 * Math.PI, this.x(d.endAngle))))
      .innerRadius((d) => Math.max(0, this.y(d.innerRadius)))
      .outerRadius((d) => Math.max(0, this.y(d.outerRadius)));
  }

  private structureDataToNodes() {
    const root: d3.HierarchyNode<any> = d3.hierarchy(this.donutData)
      .sum((d) => d.size)
      .sort((a, b) => b.value - a.value);
    const partition = d3.partition();
    this.donutNodes = partition(root).descendants();
    this.donutNodes.forEach(d => {
      d.startAngle = d.x0;
      d.endAngle = d.x1;
      d.innerRadius = d.y0;
      d.outerRadius = d.y1;
    });;
  }

  private plotDimensions() {
    this.donutContext = this.donutDimensions.svg
      .append('g')
      .attr('id', 'container')
      .attr('transform', 'translate(' + this.donutDimensions.width / 2 + ',' + this.donutDimensions.height / 2 + ')');
    const path = this.donutContext.selectAll('path')
      .data(this.donutNodes)
      .enter().append('path')
      .attr('display', (d) => null)
      .style("fill", (d) => getHexColorFromString(d.data.name + d.value))
      .style("stroke", '#fff')
      .attr('d', this.arc)
      .attr('fill-rule', 'evenodd')
      .style('opacity', 1)
      .on("click", (d) => {
        this.donutContext.transition()
          .duration(750)
          .tween("scale", () => {
            const xd = d3.interpolate(this.x.domain(), [d.x0, d.x1]);
            const yd = d3.interpolate(this.y.domain(), [d.y0, 1]);
            const yr = d3.interpolate(this.y.range(), [d.y0 ? 20 : 0, this.donutDimensions.radius]);
            return (t) => { this.x.domain(xd(t)); this.y.domain(yd(t)).range(yr(t)); };
          })
          .selectAll("path")
          .attrTween("d", (d) => (() => this.arc(d)));
      });
  }

  private resizeDonut(e: Event): void {
    this.plot();
  }

}
