import { Component, OnInit, OnChanges, Input, Output, SimpleChanges, ViewContainerRef, ElementRef, ViewEncapsulation } from '@angular/core';
import { Observable, Subject } from 'rxjs/Rx';
import * as d3 from 'd3';
import { DonutDimensions, DonutArc, DonutUtils, DonutNode } from './donut.utils';
import { MarginModel, Tooltip } from '../histogram/histogram.utils';

@Component({
  selector: 'arlas-donut',
  templateUrl: './donut.component.html',
  styleUrls: ['./donut.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DonutComponent implements OnInit, OnChanges {
  /**
   * @Input : angular
   * @description Data tree to plot in the donut.
   */
  @Input() public donutData: DonutArc;

  /**
   * @Input : angular
   * @description Sets the opacity of non-hovered or non-selected nodes.
   */
  @Input() public opacity = 0.4;


  /**
   * @Input : angular
   * @description List of selected nodes.
   */
  @Input() public selectedArcsList: Array<Array<{ringName: string, name: string}>> =
  new Array<Array<{ringName: string, name: string}>>();

  /**
   * @Input : angular
   * @description Whether the donut is multi-selectable.
   */
  @Input() public multiselectable = false;

  /**
   * @Output : angular
   * @description Emits the selected node that is positioned as the last element of the set.
   * If you go backwards on the set, you encounter the select node's parents in the right order.
   */
  @Output() public selectedNodesEvent: Subject<Array<Array<{ringName: string, name: string}>>> =
    new Subject<Array<Array<{ringName: string, name: string}>>>();
  @Output() public hoveredNodesEvent: Subject<Map<string, string>> = new Subject<Map<string, string>>();


  public donutDimensions: DonutDimensions;
  public tooltip: Tooltip = { isShown: false, isRightSide: false, xPosition: 0, yPosition: 0, xContent: '', yContent: '' };

  private donutNodes: Array<DonutNode>;
  private donutContext: any;
  private svgNode: any;
  private lastSelectedNode: DonutNode = null;
  private arc: d3.Arc<any, d3.DefaultArcObject>;
  private x: d3.ScaleLinear<number, number>;
  private y: d3.ScalePower<number, number>;

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
      if (this.multiselectable) {
        this.reapplySelection();
        this.styleNodes();
      } else {
        if (this.selectedArcsList.length === 1) {
          const selectedNode = DonutUtils.getNode(this.selectedArcsList[0], this.donutNodes);
          if (selectedNode !== null) {
            selectedNode.isSelected = true;
            this.tweenNode(selectedNode, 750);
          }
        }
      }
    }

    if (changes.selectedArcsList && this.selectedArcsList !== undefined && this.selectedArcsList !== null) {
      if (this.multiselectable) {
        this.deselectAll();
        this.reapplySelection();
        this.styleNodes();
      } else {
        if (this.selectedArcsList.length === 1) {
          this.deselectAll();
          const selectedNode = DonutUtils.getNode(this.selectedArcsList[0], this.donutNodes);
          if (selectedNode !== null) {
            selectedNode.isSelected = true;
            this.tweenNode(selectedNode, 750);
          }
        }
      }
    }
  }

  private plot(): void {
    if (this.donutContext) {
      this.donutContext.remove();
    }
    this.initializeDonutDimensions();
    this.createDonutArcs();
    this.structureDataToNodes();
    this.plotDonut();
  }

  private createDonutArcs(): void {
    this.x = d3.scaleLinear().range([0, 2 * Math.PI]);
    this.y = d3.scaleSqrt().range([0, this.donutDimensions.radius]);
    this.arc = d3.arc()
      .startAngle((d) => Math.max(0, Math.min(2 * Math.PI, this.x(d.startAngle))))
      .endAngle((d) => Math.max(0, Math.min(2 * Math.PI, this.x(d.endAngle))))
      .innerRadius((d) => Math.max(0, this.y(d.innerRadius)))
      .outerRadius((d) => Math.max(0, this.y(d.outerRadius)));
  }

  private initializeDonutDimensions(): void {
    const width = this.el.nativeElement.childNodes[0].offsetWidth;
    const height = this.el.nativeElement.childNodes[0].offsetHeight;
    const radius = Math.min(width, height) / 2;
    const svg = d3.select(this.svgNode).select('svg')
      .attr('class', 'donut__svg')
      .attr('width', width)
      .attr('height', height);
    this.donutDimensions = { svg, width, height, radius };
  }

  private structureDataToNodes(): void {
    const root: d3.HierarchyNode<any> = d3.hierarchy(this.donutData)
      .sum((d) => d.size)
      .sort((a, b) => b.value - a.value);
    const partition = d3.partition();
    this.donutNodes = <Array<DonutNode>>partition(root).descendants();
    this.donutNodes.forEach(d => {
      d.isSelected = false;
      d.startAngle = d.x0;
      d.endAngle = d.x1;
      d.innerRadius = d.y0;
      d.outerRadius = d.y1;
    });
  }

  private plotDonut(): void {
    this.donutContext = this.donutDimensions.svg
      .append('g')
      .attr('class', 'donut__arc--container')
      .attr('transform', 'translate(' + this.donutDimensions.width / 2 + ',' + this.donutDimensions.height / 2 + ')')
      .on('mouseleave', () => this.onMouseLeavesContext());
    const path = this.donutContext.selectAll('path')
      .data(this.donutNodes)
      .enter().append('path')
      .attr('class', 'donut__arc')
      .style('fill', (d) => DonutUtils.getNodeColor(d))
      .style('opacity', 1)
      .attr('d', this.arc)
      .on('click', (d) => this.onClick(d))
      .on('mouseover', (d) =>  this.onMouseOver(d))
      .on('mousemove', (d) => this.setTooltipPosition())
      .on('mouseout', (d) => this.onMouseOut());
  }

  private onClick(clickedNode: DonutNode): void {
    if (this.multiselectable) {
      if (clickedNode.depth > 0) {
        this.donutNodes[0].isSelected = false;
        if (!clickedNode.isSelected) {
          clickedNode.isSelected = true;
          this.selectedArcsList.push(DonutUtils.getNodePathAsArray(clickedNode));
        } else {
          clickedNode.isSelected = false;
          let nodeIndex = null;
          for (let i = 0; i < this.selectedArcsList.length; i++) {
            const node = DonutUtils.getNode(this.selectedArcsList[i], this.donutNodes);
            if (node === clickedNode) {
              nodeIndex = i;
              break;
            }
          }
          this.selectedArcsList.splice(nodeIndex, 1);
        }
        this.styleNodes();
        this.selectedNodesEvent.next(this.selectedArcsList);
      } else {
        if (!clickedNode.isSelected && this.selectedArcsList.length > 0) {
          clickedNode.isSelected = true;
          this.selectedArcsList = [];
          this.deselectAll();
          this.styleNodes();
          this.selectedNodesEvent.next(this.selectedArcsList);
        }
      }
    } else {
      if (clickedNode.depth > 0) {
        this.donutNodes[0].isSelected = false;

        if (!clickedNode.isSelected) {
          clickedNode.isSelected = true;
          if (this.lastSelectedNode !== null) {
            this.lastSelectedNode.isSelected = false;
          }
          this.selectedArcsList = [DonutUtils.getNodePathAsArray(clickedNode)];
          this.tweenNode(clickedNode, 750);
          this.lastSelectedNode = clickedNode;
        } else {
          clickedNode.isSelected = false;
          this.selectedArcsList = [];
          this.lastSelectedNode.isSelected = false;
          this.lastSelectedNode = null;
          this.tweenNode(this.donutNodes[0], 750);
        }
        this.selectedNodesEvent.next(this.selectedArcsList);
      } else {
        if (!clickedNode.isSelected && this.selectedArcsList.length > 0) {
          clickedNode.isSelected = true;
          this.selectedArcsList = [];
          this.lastSelectedNode.isSelected = false;
          this.lastSelectedNode = null;
          this.tweenNode(clickedNode, 750);
          this.selectedNodesEvent.next(this.selectedArcsList);
        }
      }
    }
  }

  private deselectAll(): void {
    this.donutNodes.forEach(node => {
      node.isSelected = false;
    });
  }

  private reapplySelection (): void {
    this.selectedArcsList.forEach ((nodePath) => {
      DonutUtils.getNode(nodePath, this.donutNodes).isSelected = true;
    });
  }

  private styleNodes(): void {
    if (this.selectedArcsList.length > 0) {
      this.donutContext.selectAll('path').style('opacity', this.opacity).style('stroke-width', '0.4px');
      this.donutNodes.forEach(node => {
        if (node.isSelected) {
          const nodeAncestors = node.ancestors().reverse();
          this.donutContext
            .selectAll('path')
            .filter((n) => nodeAncestors.indexOf(n) >= 0)
            .style('opacity', 1)
            .style('stroke-width', '2px');
        }
      });
    } else {
      this.donutContext.selectAll('path').style('opacity', 1).style('stroke-width', '0.4px');
    }
  }

  private tweenNode(node: DonutNode, duration: number): void {
    this.donutContext.transition()
      .duration(duration)
      .tween('scale', () => {
        const xd = d3.interpolate(this.x.domain(), [node.x0, node.x1]);
        const yd = d3.interpolate(this.y.domain(), [node.y0, 1]);
        const yr = d3.interpolate(this.y.range(), [node.y0 ? 20 : 0, this.donutDimensions.radius]);
        return (t) => { this.x.domain(xd(t)); this.y.domain(yd(t)).range(yr(t)); };
      })
      .selectAll('path')
      .attrTween('d', (d) => (() => this.arc(d)));
  }

  private resizeDonut(e: Event): void {
    this.plot();
    this.reapplySelection();
    this.styleNodes();
  }

  private onMouseOver(hoveredNode: DonutNode): void {
    this.showTooltip(hoveredNode);
    const hoveredNodeAncestors = <Array<DonutNode>>hoveredNode.ancestors().reverse();
    hoveredNodeAncestors.shift();
    if (this.multiselectable) {
      if (this.selectedArcsList.length === 0 && hoveredNode.depth > 0) {
        this.donutContext.selectAll('path').style('opacity', this.opacity);
      }
    } else {
      const opacity = (hoveredNode.depth > 0) ? 0.2 : 1;
      this.donutContext.selectAll('path').style('opacity', opacity);
    }
    this.donutContext
      .selectAll('path')
      .filter((node) => hoveredNodeAncestors.indexOf(node) >= 0)
      .style('opacity', 1);
    const arcColorMap = new Map<string, string>();
    hoveredNodeAncestors.forEach(node => {
      arcColorMap.set(node.data.name, DonutUtils.getNodeColor(node));
    });
    this.hoveredNodesEvent.next(arcColorMap);
  }

  private onMouseOut(): void {
    this.tooltip.isShown = false;
    if (this.multiselectable && this.selectedArcsList.length > 0) {
      this.styleNodes();
    } else {
      this.donutContext.selectAll('path').style('opacity', 1);
    }
  }

  private onMouseLeavesContext(): void {
    this.hoveredNodesEvent.next(new Map<string, string>());
  }

  private showTooltip(node: DonutNode): void {
    this.tooltip.isShown = true;
    this.tooltip.xContent = DonutUtils.getNodePathAsString(node) + ' (' + node.value + ')';
  }

  private setTooltipPosition() {
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
