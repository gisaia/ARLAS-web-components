import { Component, OnInit, OnChanges, Input, Output, SimpleChanges, ViewContainerRef, ElementRef, ViewEncapsulation } from '@angular/core';
import { Observable, Subject } from 'rxjs/Rx';
import * as d3 from 'd3';
import { DonutDimensions, DonutArc, DonutUtils, DonutNode } from './donut.utils';
import { MarginModel, Tooltip } from '../histogram/histogram.utils';
import * as donutJsonSchema from './donut.schema.json';


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
  @Input() public selectedArcsList: Array<Array<{ringName: string, name: string}>> =
  new Array<Array<{ringName: string, name: string}>>();

  /**
   * @Input : Angular
   * @description Whether the donut is multi-selectable.
   */
  @Input() public multiselectable = true;

  /**
   * @Output : Angular
   * @description Emits the list of selected nodes and the paths to their ultimate parent
   */
  @Output() public selectedNodesEvent: Subject<Array<Array<{ringName: string, name: string}>>> =
    new Subject<Array<Array<{ringName: string, name: string}>>>();

  /**
   * @Output : Angular
   * @description Emits the hovered node and the path to it's parents.
   * The key of the map is the node's name and the value is its color on the donut
   */
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

    if (changes.selectedArcsList && this.selectedArcsList !== undefined && this.selectedArcsList !== null
      && this.donutNodes !== undefined) {
      if (this.multiselectable) {
        this.deselectAll();
        this.removeUnExistingNodes();
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

  /**
   * @returns Json schema of the donut component for configuration
   */
  public static getDonutJsonSchema(): Object {
    return donutJsonSchema;
  }

  /**
   * @description Plots the donut
   */
  private plot(): void {
    if (this.donutContext) {
      this.donutContext.remove();
    }
    this.initializeDonutDimensions();
    this.createDonutArcs();
    this.structureDataToNodes();
    this.plotDonut();
  }

  /**
   * @description Creates donuts arcs
   */
  private createDonutArcs(): void {
    this.x = d3.scaleLinear().range([0, 2 * Math.PI]);
    this.y = d3.scaleSqrt().range([0, this.donutDimensions.radius]);
    this.arc = d3.arc()
      .startAngle((d) => Math.max(0, Math.min(2 * Math.PI, this.x(d.startAngle))))
      .endAngle((d) => Math.max(0, Math.min(2 * Math.PI, this.x(d.endAngle))))
      .innerRadius((d) => Math.max(0, this.y(d.innerRadius)))
      .outerRadius((d) => Math.max(0, this.y(d.outerRadius)));
  }

  /**
   * @description Inialize donuts dimensions
   */
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

  /**
   * @description Transforms input data to d3 nodes
   */
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

  /**
   * @description Draws the donuts arcs
   */
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
      this.removeHigherNodes(clickedNode);
      this.donutNodes[0].isSelected = false;
      if (clickedNode.depth > 0 && !clickedNode.data.isOther) {
        if (!clickedNode.isSelected) {
          this.addSelectedNode(clickedNode);
        } else {
          this.removeSelectedNode(clickedNode);
        }
        this.styleNodes();
        this.selectedNodesEvent.next(this.selectedArcsList);
      } else if (clickedNode.depth === 0) {
        if (!clickedNode.isSelected && this.selectedArcsList.length > 0) {
          clickedNode.isSelected = true;
          this.selectedArcsList = [];
          this.deselectAll();
          this.styleNodes();
          this.selectedNodesEvent.next(this.selectedArcsList);
        }
      }
    } else {
      if (clickedNode.depth > 0 && !clickedNode.data.isOther) {
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
      } else  if (clickedNode.depth === 0) {
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

  /**
   * @param clickedNode The selected node on the donut
   * @description Add the selected node to selectedArcsList
   */
  private addSelectedNode(clickedNode: DonutNode): void  {
    let hasSelectedChild = false;
    if (clickedNode.children !== undefined) {
      clickedNode.children.every(child => {
        hasSelectedChild = (<DonutNode>child).isSelected;
        return !(<DonutNode>child).isSelected;
      });
    }
    if (!hasSelectedChild) {
      clickedNode.isSelected = true;
      this.selectedArcsList.push(DonutUtils.getNodePathAsArray(clickedNode));
    }
  }

  /**
   * @param clickedNode The unselected node from the donut
   * @description Removes the selected node from selectedArcsList
   */
  private removeSelectedNode(clickedNode: DonutNode): void {
    clickedNode.isSelected = false;
    let nodeIndex = null;
    let nodeAsPath;
    for (let i = 0; i < this.selectedArcsList.length; i++) {
      const node = DonutUtils.getNode(this.selectedArcsList[i], this.donutNodes);
      if (node === clickedNode) {
        nodeIndex = i;
        nodeAsPath = this.selectedArcsList[i];
        break;
      }
    }
    this.selectedArcsList.splice(nodeIndex, 1);
    this.removeAllSimilarNodesOfSameRing(nodeAsPath);
  }

  /**
   * @param clickedNode The selected/unselected node of the donut
   * @description Removes from selectArcsList all the parent nodes of the clicked node that are selected
  */
  private removeHigherNodes(clickedNode: DonutNode): void {
    const nodeAsArray = DonutUtils.getNodePathAsArray(clickedNode);
    const listOfHigherNodesToRemove = [];
    while (nodeAsArray.length > 1) {
      nodeAsArray.shift();
      const higherNode = DonutUtils.getNode(nodeAsArray, this.donutNodes);
      this.selectedArcsList.forEach(selectedArc => {
        if (selectedArc.length === nodeAsArray.length) {
          const selectedNode = DonutUtils.getNode(selectedArc, this.donutNodes);
          if (higherNode === selectedNode) {
            listOfHigherNodesToRemove.push(this.selectedArcsList.indexOf(selectedArc));
          }
        }
      });
    }
    for (let i = 0; i < listOfHigherNodesToRemove.length; i++) {
      this.selectedArcsList.splice(listOfHigherNodesToRemove[i] - i, 1);
    }
  }

  /**
   * @description Removes the unexisting nodes in the donut from the selectedArcsList
   */
  private removeUnExistingNodes(): void {
     const listUnExistingNodesToRemove = [];
     this.selectedArcsList.forEach(arc => {
       if (DonutUtils.getNode(arc, this.donutNodes) === null) {
         listUnExistingNodesToRemove.push(this.selectedArcsList.indexOf(arc));
       }
     });
     for (let i = 0; i < listUnExistingNodesToRemove.length; i++) {
       this.selectedArcsList.splice(listUnExistingNodesToRemove[i] - i, 1);
     }
  }

  /**
   * @param selectedArc Path from the selected arc to the ultimate parent (as an array)
   * @description REMOVES ALL THE NODES OF SAME RING HAVING THE SAME VALUE FROM THE SELECTEDARCSLIST,
   * ONLY IF THERE IS A DIFFERENT VALUE ALREADY SELECTED ON THIS RING
   */
  private removeAllSimilarNodesOfSameRing(selectedArc: Array<{ringName: string, name: string}>): void {
    const listNodesToRemove = [];
    let removeAll = false;
    for (let i = 0; i < this.selectedArcsList.length; i++) {
      const arc = this.selectedArcsList[i];
      if (arc.length === selectedArc.length && arc[0].ringName === selectedArc[0].ringName && arc[0].name !== selectedArc[0].name) {
        removeAll = true;
        break;
      }
    }

    if (removeAll) {
      for (let i = 0; i < this.selectedArcsList.length; i++) {
        const arc = this.selectedArcsList[i];
        if (arc.length === selectedArc.length && arc[0].ringName === selectedArc[0].ringName && arc[0].name === selectedArc[0].name) {
          listNodesToRemove.push(i);
        }
      }
    }
    for (let i  = 0; i < listNodesToRemove.length; i++) {
      this.selectedArcsList.splice(listNodesToRemove[i] - i, 1);
    }
  }

  /**
   * @description Set isSelected attribute to false for all the donut's nodes
   */
  private deselectAll(): void {
    this.donutNodes.forEach(node => {
      node.isSelected = false;
    });
  }

  /**
   * @description Set isSelected attribute to true giving the selectedArcsList
   */
  private reapplySelection (): void {
    this.selectedArcsList.forEach ((nodePath) => {
      const node = DonutUtils.getNode(nodePath, this.donutNodes);
      if (node !== null) {
        node.isSelected = true;
      }
    });
  }

  /**
   * @description Styles the nodes according to their states
   */
  private styleNodes(): void {
    if (this.selectedArcsList.length > 0) {
      this.donutContext.selectAll('path').style('opacity', this.opacity).style('stroke-width', '0px');
      this.donutNodes.forEach(node => {
        if (node.isSelected) {
          const nodeAncestors = node.ancestors().reverse();
          this.donutContext
            .selectAll('path')
            .filter((n) => nodeAncestors.indexOf(n) >= 0)
            .style('opacity', 1)
            .style('stroke-width', '0.5px');
        }
      });
    } else {
      this.donutContext.selectAll('path').style('opacity', 1).style('stroke-width', '0px');
    }
  }

  /**
   * @param node Clicked on node
   * @param duration Duration of the animation
   * @description Apply animation after clicking on the node.
   */
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

  /**
   * @description Resizes donut on window resize event.
   */
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
      if (this.selectedArcsList.length === 0 && hoveredNode.depth > 0 && !hoveredNode.data.isOther) {
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
