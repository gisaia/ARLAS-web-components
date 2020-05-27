import { Component, OnInit, ViewChild, ElementRef, Input, AfterViewInit, SimpleChanges, OnChanges } from '@angular/core';
import { Legend, PROPERTY_SELECTOR_SOURCE } from '../mapgl-legend/mapgl-legend.component';
import { TranslateService } from '@ngx-translate/core';
import { select } from 'd3-selection';

@Component({
  selector: 'arlas-mapgl-layer-icon',
  templateUrl: './mapgl-layer-icon.component.html',
  styleUrls: ['./mapgl-layer-icon.component.css']
})
export class MapglLayerIconComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() public layer: mapboxgl.Layer;
  @Input() public colorLegend: Legend = {};
  @Input() public widthLegend: Legend = {};
  @Input() public radiusLegend: Legend = {};
  @ViewChild('layer_icon', { read: ElementRef, static: false }) public layerIconElement: ElementRef;

  constructor(public translate: TranslateService) { }

  public ngOnInit() {
  }

  public ngAfterViewInit() {
    if (this.layer) {
      this.drawIcons();
    }
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes['layer'] !== undefined) {
      if (this.layer) {
        this.drawIcons();
      }
    }
  }

  private drawIcons(): void {
    const type = this.layer.type;
    const paint = this.layer.paint;
    const source: string = this.layer.source as string;
    switch (type) {
      case 'circle': {
        const p: mapboxgl.CirclePaint = (paint as mapboxgl.CirclePaint);
        if (source.startsWith('feature') || source.startsWith('feature-metric')) {
          drawFeatureCircleIcon(this.layerIconElement.nativeElement, this.colorLegend);
        } else if (source.startsWith('cluster')) {
          drawClusterCircleIcon(this.layerIconElement.nativeElement, this.colorLegend);
        }
        break;
      }
      case 'line': {
        const p: mapboxgl.LinePaint = (paint as mapboxgl.LinePaint);
        drawLineIcon(this.layerIconElement.nativeElement, this.colorLegend);
        break;
      }
      case 'fill': {
        const p: mapboxgl.FillPaint = (paint as mapboxgl.FillPaint);
        if (source.startsWith('cluster')) {
          drawClusterFillIcon(this.layerIconElement.nativeElement, this.colorLegend);
        } else {
          // todo
        }
        break;
      }
      case 'heatmap': {
        const p: mapboxgl.HeatmapPaint = (paint as mapboxgl.HeatmapPaint);
        if (source.startsWith('cluster')) {
          drawClusterHeatmapIcon(this.layerIconElement.nativeElement, this.colorLegend);
        } else {
          // todo
        }
        break;
      }
    }
  }

}

/**
 * draws the rectangles icon for cluster mode
 * @param svgNode SVG element on which we append the rectangles using d3.
 * @param colorLegend Color legend, to give the drawn icons rectagles the same color on the map
 */
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
  svg.selectAll('g').remove();
  svg.append('g').append('rect')
        .attr('height', 7).attr('width', 7)
        .attr('fill', fourColors[0])
        .attr('stroke', fourColors[0])
        .attr('y', 3).attr('x', 3);
  svg.append('g').append('rect')
      .attr('height', 7).attr('width', 7)
      .attr('fill', fourColors[1]).attr('fill-opacity', 0.6)
      .attr('stroke', fourColors[1]).attr('stroke-width', 0.6)
      .attr('y', 10).attr('x', 3);
  svg.append('g').append('rect')
      .attr('height', 7).attr('width', 7)
      .attr('fill', fourColors[2]).attr('fill-opacity', 0.6)
      .attr('stroke', fourColors[2]).attr('stroke-width', 0.6)
      .attr('y', 10).attr('x', 10);
  svg.append('g').append('rect')
      .attr('height', 7).attr('width', 7)
      .attr('fill', fourColors[3]).attr('fill-opacity', 0.6)
      .attr('stroke', fourColors[3]).attr('stroke-width', 0.6)
      .attr('y', 3).attr('x', 10);

}

/**
 * draws the heatmap icon for cluster mode
 * @param svgNode SVG element on which we append the heamap circles using d3.
 * @param colorLegend Color legend, to give the drawn icons circles the same color on the map
 */
export function drawClusterHeatmapIcon(svgNode: SVGElement, colorLegend: Legend) {
  const heatmapColors = [];
  if (colorLegend.type === PROPERTY_SELECTOR_SOURCE.interpolated) {
    const iv = colorLegend.interpolatedValues;
    if (iv) {
      if (iv.length === 1) {
        for (let i = 0; i < 3; i++) {
          heatmapColors.push(iv[0]);
        }
      } else if (iv.length === 2) {
        heatmapColors.push(iv[0]);
        heatmapColors.push(iv[0]);
        heatmapColors.push(iv[1]);
      } else if (iv.length === 3) {
        heatmapColors.push(iv[1]);
        heatmapColors.push(iv[Math.trunc(iv.length / 2)]);
        heatmapColors.push(iv[iv.length - 1]);
      } else if (iv.length >= 4) {
        heatmapColors.push(iv[1]);
        heatmapColors.push(iv[Math.trunc( iv.length / 3)]);
        heatmapColors.push(iv[Math.trunc(2 * iv.length / 3)]);
        heatmapColors.push(iv[iv.length - 1]);
      }
    }
  }
  const svg = select(svgNode);
  svg.selectAll('defs').remove();
  svg.selectAll('circle').remove();
  svg.append('defs')
    .append('filter').attr('id', 'blur')
    .append('feGaussianBlur').attr('stdDeviation', 0.8);
  svg.selectAll('circle')
    .data(heatmapColors).enter()
    .append('circle')
    .attr('cx', 10).attr('cy', 10)
    .attr('r', (d, i) => {
      if (i === 0) { return 10; }
      if (i === 1) { return 8; }
      if (i === 2) { return 6; }
      if (i === 3) { return 3; }
    })
    .style('fill', (d, i) => d)
    .attr('filter', 'url(#blur)');
}
/**
 * draws the line icon for feature mode
 * @param svgNode SVG element on which we append the line using d3.
 * @param colorLegend Color legend, to give the drawn icons line the same color on the map
 */
export function drawLineIcon(svgNode: SVGElement, colorLegend: Legend) {
  if (colorLegend.type === PROPERTY_SELECTOR_SOURCE.fix) {
    const svg = select(svgNode);
    svg.selectAll('g').remove();
    svg.append('g').append('line')
        .attr('x1', 0).attr('y1', 18)
        .attr('x2', 6).attr('y2', 10)
        .attr('cx', 2).attr('cy', 2)
        .attr('stroke', colorLegend.fixValue).attr('stroke-width', 2);
    svg.append('g').append('line')
        .attr('x1', 6).attr('y1', 10)
        .attr('x2', 12).attr('y2', 8)
        .attr('cx', 2).attr('cy', 2)
        .attr('stroke', colorLegend.fixValue).attr('stroke-width', 2);
    svg.append('g').append('line')
        .attr('x1', 12).attr('y1', 9)
        .attr('x2', 18).attr('y2', 0)
        .attr('cx', 2).attr('cy', 2)
        .attr('stroke', colorLegend.fixValue).attr('stroke-width', 2);
  } else if (colorLegend.type === PROPERTY_SELECTOR_SOURCE.interpolated) {
    const threeColors = [];
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
    } else {
      threeColors.push('#2da4ff');
      threeColors.push('#2da4ff');
      threeColors.push('#2da4ff');
    }
    const svg = select(svgNode);
    svg.selectAll('g').remove();
    svg.append('g').append('line')
        .attr('x1', 0).attr('y1', 18)
        .attr('x2', 6).attr('y2', 10)
        .attr('cx', 2).attr('cy', 2)
        .attr('stroke', threeColors[0]).attr('stroke-width', 2);
    svg.append('g').append('line')
        .attr('x1', 6).attr('y1', 10)
        .attr('x2', 12).attr('y2', 8)
        .attr('cx', 2).attr('cy', 2)
        .attr('stroke', threeColors[1]).attr('stroke-width', 2);
    svg.append('g').append('line')
        .attr('x1', 12).attr('y1', 9)
        .attr('x2', 18).attr('y2', 0)
        .attr('cx', 2).attr('cy', 2)
        .attr('stroke', threeColors[2]).attr('stroke-width', 2);
  } else if (colorLegend.type === PROPERTY_SELECTOR_SOURCE.manual || colorLegend.type === PROPERTY_SELECTOR_SOURCE.generated
    || colorLegend.type === PROPERTY_SELECTOR_SOURCE.provided) {
    const iv = colorLegend.manualValues as Map<string, string>;
    const colorsList = [];
    if (iv) {
      if (iv.size === 1) {
        const c = iv.values().next().value;
        colorsList.push(c);
        colorsList.push(c);
      } else if (iv.size === 2) {
        colorsList.push(Array.from(iv.values())[0]);
        colorsList.push(Array.from(iv.values())[1]);
      } else if (iv.size >= 3) {
        colorsList.push(Array.from(iv.values())[0]);
        colorsList.push(Array.from(iv.values())[Array.from(iv.keys()).length - 1]);
      }
    } else if (!iv || iv.size === 0) {
      colorsList.push('#eee');
      colorsList.push('#eee');
    }
    const svg = select(svgNode);
    svg.selectAll('g').remove();
    svg.append('g').append('line')
        .attr('x1', 0).attr('y1', 18)
        .attr('x2', 6).attr('y2', 10)
        .attr('cx', 2).attr('cy', 2)
        .attr('stroke', colorsList[0]).attr('stroke-width', 1.5);
    svg.append('g').append('line')
        .attr('x1', 6).attr('y1', 10)
        .attr('x2', 12).attr('y2', 8)
        .attr('cx', 2).attr('cy', 2)
        .attr('stroke', colorsList[0]).attr('stroke-width', 1.5);
    svg.append('g').append('line')
        .attr('x1', 12).attr('y1', 9)
        .attr('x2', 18).attr('y2', 0)
        .attr('cx', 2).attr('cy', 2)
        .attr('stroke', colorsList[0]).attr('stroke-width', 1.5);
    svg.append('g').append('line')
        .attr('x1', 0).attr('y1', 0)
        .attr('x2', 11).attr('y2', 8)
        .attr('cx', 2).attr('cy', 2)
        .attr('stroke', colorsList[1]).attr('stroke-width', 1.5);
    svg.append('g').append('line')
        .attr('x1', 11).attr('y1', 8)
        .attr('x2', 18).attr('y2', 18)
        .attr('cx', 2).attr('cy', 2)
        .attr('stroke', colorsList[1]).attr('stroke-width', 1.5);
  }
}
/**
 * draws the circle icon for feature mode
 * @param svgNode SVG element on which we append the circles using d3.
 * @param colorLegend Color legend, to give the drawn icons circles the same color on the map
 */
export function drawFeatureCircleIcon(svgNode: SVGElement, colorLegend: Legend) {
  const colorsList = [];
  if (colorLegend.type === PROPERTY_SELECTOR_SOURCE.fix) {
    colorsList.push(colorLegend.fixValue);
  } else if (colorLegend.type === PROPERTY_SELECTOR_SOURCE.interpolated) {
    const iv = colorLegend.interpolatedValues;
    if (iv) {
      if (iv.length === 1) {
        for (let i = 0; i < 3; i++) {
          colorsList.push(iv[0]);
        }
      } else if (iv.length === 2) {
        colorsList.push(iv[0]);
        colorsList.push(iv[0]);
        colorsList.push(iv[1]);
      } else if (iv.length === 3) {
        colorsList.push(iv[0]);
        colorsList.push(iv[Math.trunc(iv.length / 2)]);
        colorsList.push(iv[iv.length - 1]);
      } else if (iv.length >= 4) {
        colorsList.push(iv[1]);
        colorsList.push(iv[Math.trunc( iv.length / 3)]);
        colorsList.push(iv[iv.length - 1]);
      }
    }
  } else if (colorLegend.type === PROPERTY_SELECTOR_SOURCE.manual || colorLegend.type === PROPERTY_SELECTOR_SOURCE.generated
    || colorLegend.type === PROPERTY_SELECTOR_SOURCE.provided) {
    const iv = colorLegend.manualValues as Map<string, string>;
    if (iv) {
      if (iv.size === 1) {
        const color = iv.values().next().value;
        colorsList.push(color);
        colorsList.push(color);
        colorsList.push(color);
      } else if (iv.size === 2) {
        colorsList.push(Array.from(iv.values())[0]);
        colorsList.push(Array.from(iv.values())[0]);
        colorsList.push(Array.from(iv.values())[1]);
      } else if (iv.size >= 3) {
        colorsList.push(Array.from(iv.values())[0]);
        colorsList.push(Array.from(iv.values())[Math.trunc(Array.from(iv.keys()).length / 2)]);
        colorsList.push(Array.from(iv.values())[Array.from(iv.keys()).length - 1]);
      }
    } else if (!iv || iv.size === 0) {
        colorsList.push('#eee');
        colorsList.push('#eee');
        colorsList.push('#eee');
    }
  }

  const svg = select(svgNode);
  svg.selectAll('circle').remove();
  svg.selectAll('circle')
    .data(colorsList).enter()
    .append('circle')
    .attr('cx', (d, i) => {
      if (colorsList.length === 1) {
        return 10;
      } else {
        if (i === 0) { return 6; }
        if (i === 1) { return 12; }
        if (i === 2) { return 5; }
      }
    })
    .attr('cy', (d, i) => {
      if (colorsList.length === 1) {
        return 10;
      } else {
        if (i === 0) { return 5; }
        if (i === 1) { return 10; }
        if (i === 2) { return 15; }
      }
    })
    .attr('r', (d, i) => {
      if (colorsList.length === 1) {
        return 7;
      } else {
        return 3;
      }
    })
    .style('fill', (d, i) => d).style('fill-opacity', colorsList.length === 1 ? 0.6 : 0.8)
    .style('stroke', (d, i) => d).style('stroke-width', 0.5);
}


/**
 * draws the circle icon for cluster mode
 * @param svgNode SVG element on which we append the circles using d3.
 * @param colorLegend Color legend, to give the drawn icons circles the same color on the map
 */
export function drawClusterCircleIcon(svgNode: SVGElement, colorLegend: Legend) {
  // todo include radius legend in drawing icons
  const colorsList = [];
  if (colorLegend.type === PROPERTY_SELECTOR_SOURCE.fix) {
    colorsList.push(colorLegend.fixValue);
    colorsList.push(colorLegend.fixValue);
    colorsList.push(colorLegend.fixValue);
  } else if (colorLegend.type === PROPERTY_SELECTOR_SOURCE.interpolated) {
    const iv = colorLegend.interpolatedValues;
    if (iv) {
      if (iv.length === 1) {
        for (let i = 0; i < 3; i++) {
          colorsList.push(iv[0]);
        }
      } else if (iv.length === 2) {
        colorsList.push(iv[0]);
        colorsList.push(iv[0]);
        colorsList.push(iv[1]);
      } else if (iv.length === 3) {
        colorsList.push(iv[0]);
        colorsList.push(iv[Math.trunc(iv.length / 2)]);
        colorsList.push(iv[iv.length - 1]);
      } else if (iv.length >= 4) {
        colorsList.push(iv[1]);
        colorsList.push(iv[Math.trunc( iv.length / 3)]);
        colorsList.push(iv[iv.length - 1]);
      }
    }
  }
  const svg = select(svgNode);
  svg.selectAll('circle').remove();
  svg.selectAll('circle')
    .data(colorsList).enter()
    .append('circle')
    .attr('cx', (d, i) => {
      if (i === 0) { return 12; }
      if (i === 1) { return 6; }
      if (i === 2) { return 10; }
    })
    .attr('cy', (d, i) => {
      if (i === 0) { return 7; }
      if (i === 1) { return 11; }
      if (i === 2) { return 15; }
    })
    .attr('r', (d, i) => {
      if (i === 0) { return 6; }
      if (i === 1) { return 5; }
      if (i === 2) { return 3; }
    })
    .style('fill', (d, i) => d).style('fill-opacity', 0.7)
    .style('stroke', (d, i) => d).style('stroke-width', 0.5);
}
