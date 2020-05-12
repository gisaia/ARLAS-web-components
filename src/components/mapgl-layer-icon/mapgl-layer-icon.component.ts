import { Component, OnInit, ViewChild, ElementRef, Input, AfterViewInit, SimpleChanges, OnChanges } from '@angular/core';
import { ColorLegend, Legend, PROPERTY_SELECTOR_SOURCE } from '../mapgl-legend/legend';
import { TranslateService } from '@ngx-translate/core';
import { curveLinear, area, line } from 'd3-shape';
import { scaleLinear, ScaleLinear } from 'd3-scale';
import { select } from 'd3-selection';

@Component({
  selector: 'arlas-mapgl-layer-icon',
  templateUrl: './mapgl-layer-icon.component.html',
  styleUrls: ['./mapgl-layer-icon.component.css']
})
export class MapglLayerIconComponent extends ColorLegend implements OnInit, AfterViewInit, OnChanges {
  @Input() public layer: mapboxgl.Layer;
  @ViewChild('layer_icon', { read: ElementRef, static: false }) public layerIconElement: ElementRef;

  constructor(public translate: TranslateService) {
    super(translate);
  }

  public ngOnInit() {
  }

  public ngAfterViewInit() {
    if (this.layer) {
      this.getIcons();
    }
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes['layer'] !== undefined) {
      if (this.layer) {
        this.getIcons();
      }
    }
  }


  private getIcons(): void {
    const type = this.layer.type;
    const paint = this.layer.paint;
    const source: string = this.layer.source as string;

    switch (type) {
      case 'circle': {
        const p: mapboxgl.CirclePaint = (paint as mapboxgl.CirclePaint);
        this.buildColorLegend(p['circle-color']);
        break;
      }
      case 'line': {
        const p: mapboxgl.LinePaint = (paint as mapboxgl.LinePaint);
        this.buildColorLegend(p['line-color']);
        if (source.startsWith('feature') && !source.startsWith('feature-metric')) {
          drawFeatureLineIcon(this.layerIconElement.nativeElement,this.colorLegend)
        }
        break;
      }
      case 'fill': {
        const p: mapboxgl.FillPaint = (paint as mapboxgl.FillPaint);
        this.buildColorLegend(p['fill-color']);
        if (source.startsWith('cluster')) {
          drawClusterFillIcon(this.layerIconElement.nativeElement, this.colorLegend);
        } else {

        }
        break;
      }
      case 'heatmap': {
        const p: mapboxgl.LinePaint = (paint as mapboxgl.LinePaint);
        this.buildColorLegend(p['heatmap-color']);
        if (source.startsWith('cluster')) {
          drawClusterHeatmapIcon(this.layerIconElement.nativeElement, this.colorLegend);
        }
        break;
      }
    }
  }

}

export function drawClusterFillIcon(svgNode: SVGElement, colorLegend: Legend) {
  const fourColors = [];
  if (colorLegend.type === PROPERTY_SELECTOR_SOURCE.interpolated) {
    const iv = colorLegend.interpolatedValues;
    if (iv) {
      if (iv.length === 1) {
        for (let i = 0; i < 4; i++) {
          fourColors.push(iv[0]);
        }
      } else if (iv.length === 2) {
        fourColors.push(iv[0]);
        fourColors.push(iv[1]);
        fourColors.push(iv[0]);
        fourColors.push(iv[1]);
      } else if (iv.length >= 3) {
        fourColors.push(iv[0]);
        fourColors.push(iv[Math.trunc(2 * iv.length / 3)]);
        fourColors.push(iv[iv.length - 1]);
        fourColors.push(iv[Math.trunc(iv.length / 3)]);
      }
    }
  }
  const svg = select(svgNode);
  svg.append('g').append('rect')
        .attr('height', 7)
        .attr('width', 7)
        .attr('fill', fourColors[0])
        .attr('stroke', fourColors[0])
        .attr('y', 3)
        .attr('x', 3);
  svg.append('g').append('rect')
      .attr('height', 7)
      .attr('width', 7)
      .attr('fill', fourColors[1])
      .attr('fill-opacity', 0.6)
      .attr('stroke', fourColors[1])
      .attr('stroke-width', 0.6)
      .attr('y', 10)
      .attr('x', 3);
  svg.append('g').append('rect')
      .attr('height', 7)
      .attr('width', 7)
      .attr('fill', fourColors[2])
      .attr('fill-opacity', 0.6)
      .attr('stroke', fourColors[2])
      .attr('stroke-width', 0.6).attr('y', 10)
      .attr('x', 10);
  svg.append('g').append('rect')
      .attr('height', 7)
      .attr('width', 7)
      .attr('fill', fourColors[3])
      .attr('fill-opacity', 0.6)
      .attr('stroke', fourColors[3])
      .attr('stroke-width', 0.6).attr('y', 3)
      .attr('x', 10);

}


export function drawClusterHeatmapIcon(svgNode: SVGElement, colorLegend: Legend) {
  const threeColors = [];
  if (colorLegend.type === PROPERTY_SELECTOR_SOURCE.interpolated) {
    const iv = colorLegend.interpolatedValues;
    if (iv) {
      if (iv.length === 1) {
        for (let i = 0; i < 3; i++) {
          threeColors.push(iv[0]);
        }
      } else if (iv.length === 2) {
        threeColors.push(iv[0]);
        threeColors.push(iv[0]);
        threeColors.push(iv[1]);
      } else if (iv.length === 3) {
        threeColors.push(iv[1]);
        threeColors.push(iv[Math.trunc(iv.length / 2)]);
        threeColors.push(iv[iv.length - 1]);
      } else if (iv.length >= 4) {
        threeColors.push(iv[1]);
        threeColors.push(iv[Math.trunc( iv.length / 3)]);
        threeColors.push(iv[Math.trunc(2 * iv.length / 3)]);
        threeColors.push(iv[iv.length - 1]);
      }
    }
  }

  const svg = select(svgNode);
  svg.append('defs')
    .append('filter')
    .attr('id', 'blur')
    .append('feGaussianBlur')
    .attr('stdDeviation', 0.8);

  svg.selectAll('circle')
    .data(threeColors).enter()
    .append('circle')
    .attr('cx', 10)
    .attr('cy', 10)
    .attr('r', (d, i) => {
      if (i === 0) { return 10; }
      if (i === 1) { return 8; }
      if (i === 2) { return 6; }
      if (i === 3) { return 3; }
    })
    .style('fill', (d, i) => d)
    .attr('filter', 'url(#blur)');
}

export function drawFeatureLineIcon(svgNode: SVGElement, colorLegend: Legend) {
  const threeColors = [];
  if (colorLegend.type === PROPERTY_SELECTOR_SOURCE.interpolated) {
    const iv = colorLegend.interpolatedValues;
    if (iv) {
      if (iv.length === 1) {
        for (let i = 0; i < 3; i++) {
          threeColors.push(iv[0]);
        }
      } else if (iv.length === 2) {
        threeColors.push(iv[0]);
        threeColors.push(iv[0]);
        threeColors.push(iv[1]);
      } else if (iv.length >= 3) {
        threeColors.push(iv[0]);
        threeColors.push(iv[Math.trunc(iv.length / 2)]);
        threeColors.push(iv[iv.length - 1]);
      }
    }
  }
  const svg = select(svgNode);
  svg.append('g').append('line')
      .attr('x1', 0)
      .attr('y1', 18)
      .attr('x2', 6)
      .attr('y2', 10)
      .attr('cx', 2)
      .attr('cy', 2)
      .attr('stroke', threeColors[0])
      .attr('stroke-width', 3);
  svg.append('g').append('line')
      .attr('x1', 6)
      .attr('y1', 10)
      .attr('x2', 12)
      .attr('y2', 8)
      .attr('cx', 2)
      .attr('cy', 2)
      .attr('stroke', threeColors[1])
      .attr('stroke-width', 3);
  svg.append('g').append('line')
      .attr('x1', 12)
      .attr('y1', 9)
      .attr('x2', 18)
      .attr('y2', 0)
      .attr('cx', 2)
      .attr('cy', 2)
      .attr('stroke', threeColors[2])
      .attr('stroke-width', 3);
}
