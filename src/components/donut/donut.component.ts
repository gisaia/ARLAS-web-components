import { Component, OnInit, OnChanges, Input, Output, SimpleChanges, ViewContainerRef, ElementRef, ViewEncapsulation } from '@angular/core';
import { Observable, Subject } from 'rxjs/Rx';
import * as d3 from 'd3';
import { DonutDimensions, DonutArc } from './donut.utils';
import { MarginModel, Tooltip } from '../histogram/histogram.utils';
import { ColorBuilder } from '../componentsUtils';

@Component({
  selector: 'arlas-donut',
  templateUrl: './donut.component.html',
  styleUrls: ['./donut.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DonutComponent implements OnInit, OnChanges, ColorBuilder {
  /**
   * @Input : angular
   * @description Data tree to plot in the donut.
   */
  @Input() public donutData: DonutArc;

  /**
   * @Output : angular
   * @description Emits the selected node that is positioned as the last element of the set.
   * If you go backwards on the set, you encounter the select node's parents in the right order.
   */
  @Output() public selectedNodesEvent: Subject<Set<string>> = new Subject<Set<string>>();
  @Output() public hoveredNodesEvent: Subject<Map<string, string>> = new Subject<Map<string, string>>();


  public donutDimensions: DonutDimensions;
  public tooltip: Tooltip = { isShown: false, isRightSide: false, xPosition: 0, yPosition: 0, xContent: '', yContent: '' };

  private donutNodes: any;
  private donutContext: any;
  private svgNode: any;
  private margin: MarginModel = { top: 4, right: 10, bottom: 20, left: 60 };
  private arc: d3.Arc<any, d3.DefaultArcObject>;
  private x: d3.ScaleLinear<number, number>;
  private y: d3.ScalePower<number, number>;
  private donutPath: string;
  private donutPathSet: Set<string>;
  private selectedNode: d3.HierarchyRectangularNode<any>;

  constructor(private viewContainerRef: ViewContainerRef, private el: ElementRef) {
    Observable.fromEvent(window, 'resize')
      .debounceTime(500)
      .subscribe((event: Event) => { this.resizeDonut(event); });
  }

  public ngOnInit() {
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.svgNode = this.viewContainerRef.element.nativeElement;
    if (changes.donutData && this.donutData !== undefined && this.donutData !== null) {
      this.plot();
    }
  }

  public getHexColorFromString(text: string): string {
    // string to int
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
       hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    // int to rgb
    const hex = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    const colorHex = '#' + '00000'.substring(0, 6 - hex.length) + hex;
    return colorHex;
  }

  private plot() {
    if (this.donutContext) {
      this.donutContext.remove();
    }
    this.initializeDonutDimensions();
    this.createDonutArcs();
    this.structureDataToNodes();
    this.plotDonut();
  }

  private initializeDonutDimensions(): void {
    const margin = this.margin;
    const width = this.el.nativeElement.childNodes[0].offsetWidth;
    const height = this.el.nativeElement.childNodes[0].offsetHeight;
    const radius = Math.min(width, height) / 2;
    const svg = d3.select(this.svgNode).select('svg')
      .attr('class', 'donut__svg')
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
    });
  }

  private plotDonut() {
    this.donutContext = this.donutDimensions.svg
      .append('g')
      .attr('class', 'donut__arc--container')
      .attr('transform', 'translate(' + this.donutDimensions.width / 2 + ',' + this.donutDimensions.height / 2 + ')')
      .on('mouseleave', () => this.onMouseLeavesContext());
    const path = this.donutContext.selectAll('path')
      .data(this.donutNodes)
      .enter().append('path')
      .attr('class', 'donut__arc')
      .style('fill', (d) => this.getNodeColor(d))
      .attr('d', this.arc)
      .on('click', (d) => {
        this.selectNode(d, 750);
        this.donutPath = this.getPath(d);
        this.emitSelectedNode();
        this.selectedNode = d;
      })
      .on('mouseover', (d) =>  this.onMouseOver(d))
      .on('mousemove', (d) => this.setTooltipPosition(d))
      .on('mouseout', (d) => this.onMouseOut(d));
  }

  private getNodeColor(d: d3.HierarchyRectangularNode<any>): string {
    return d.depth > 0 ? this.getHexColorFromString(d.data.name + ':' + d.data.ringName) : '#fff';
  }

  private selectNode(d: d3.HierarchyRectangularNode<any>, duration: number): void {
    this.donutContext.transition()
      .duration(duration)
      .tween('scale', () => {
        const xd = d3.interpolate(this.x.domain(), [d.x0, d.x1]);
        const yd = d3.interpolate(this.y.domain(), [d.y0, 1]);
        const yr = d3.interpolate(this.y.range(), [d.y0 ? 20 : 0, this.donutDimensions.radius]);
        return (t) => { this.x.domain(xd(t)); this.y.domain(yd(t)).range(yr(t)); };
      })
      .selectAll('path')
      .attrTween('d', (d) => (() => this.arc(d)));
  }

  private getPath(n: d3.HierarchyRectangularNode<any>): string {
    let path = n.data.name;
    if (n.parent && n.parent.parent) {
      while (n.parent.parent) {
        n = n.parent;
        path = n.data.name + ' > ' + path;
      }
    }
    return path;
  }

  private emitSelectedNode(): void {
    const hierarchyNodes = this.donutPath.split('>');
    this.donutPathSet = new Set<string>();
    hierarchyNodes.forEach(nodeName => {
      this.donutPathSet.add(nodeName.trim());
    });
    this.selectedNodesEvent.next(this.donutPathSet);
  }


  private resizeDonut(e: Event): void {
    this.plot();
    if (this.selectedNode !== undefined) {
      this.selectNode(this.selectedNode, 0);
    }
  }

  private onMouseOver(d: d3.HierarchyRectangularNode<any>): void {
    this.showTooltip(d);
    const sequenceArray = d.ancestors().reverse();
    sequenceArray.shift();
    // Fade all the arcs.
    d3.selectAll('path').style('opacity', 0.4);
    // Then highlight only those that are an ancestor of the current arc.
    this.donutContext
      .selectAll('path')
      .filter((node) => sequenceArray.indexOf(node) >= 0)
      .style('opacity', 1);
    const arcColorMap = new Map<string, string>();
    sequenceArray.forEach(node => {
      arcColorMap.set(node.data.name, this.getNodeColor(node));
    });
    this.hoveredNodesEvent.next(arcColorMap);
  }

  private onMouseOut(d: d3.HierarchyRectangularNode<any>): void {
    this.tooltip.isShown = false;
    this.donutContext.selectAll('path').style('opacity', 1);
  }

  private onMouseLeavesContext() {
    this.hoveredNodesEvent.next(new Map<string, string>());
  }

  private showTooltip(d: d3.HierarchyRectangularNode<any>): void {
    this.tooltip.isShown = true;
    this.tooltip.xContent = this.getPath(d) + ' (' + d.value + ')';
  }

  private setTooltipPosition(d: d3.HierarchyRectangularNode<any>) {
    const xPosition = this.donutDimensions.width / 2 + d3.mouse(<d3.ContainerElement>this.donutContext.node())[0];
    if (xPosition > this.donutDimensions.width / 2) {
      this.tooltip.isRightSide = true;
      this.tooltip.xPosition = this.donutDimensions.width - xPosition + 10;
    } else {
      this.tooltip.isRightSide = false;
      this.tooltip.xPosition = xPosition + 15;
    }
    this.tooltip.yPosition = d3.mouse(<d3.ContainerElement>this.donutContext.node())[1] - 5 + (this.donutDimensions.height / 2);
  }

}
