import { Component, OnInit, ViewChild, ElementRef, Input, AfterViewInit, SimpleChanges, OnChanges } from '@angular/core';
import { select } from 'd3-selection';
import { Legend, PROPERTY_SELECTOR_SOURCE } from '../mapgl/mapgl.component.util';

@Component({
  selector: 'arlas-mapgl-layer-icon',
  templateUrl: './mapgl-layer-icon.component.html',
  styleUrls: ['./mapgl-layer-icon.component.css']
})
export class MapglLayerIconComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() public layer: mapboxgl.Layer;
  @Input() public colorLegend: Legend = {};
  @Input() public strokeColorLegend: Legend = {};
  @Input() public widthLegend: Legend = {};
  @Input() public radiusLegend: Legend = {};
  @Input() public lineDasharray;
  @ViewChild('layer_icon', { read: ElementRef, static: false }) public layerIconElement: ElementRef;

  public constructor() { }

  public ngOnInit() {
  }

  public ngAfterViewInit() {
    if (this.layer) {
      this.drawIcons();
    }
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes['layer'] !== undefined) {
      if (this.layer && this.layerIconElement) {
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
      if (source.startsWith('feature-metric')) {
        drawFeatureCircleIcon(this.layerIconElement.nativeElement, this.colorLegend, this.strokeColorLegend, true);
      } else if (source.startsWith('feature')) {
        drawFeatureCircleIcon(this.layerIconElement.nativeElement, this.colorLegend, this.strokeColorLegend);
      } else if (source.startsWith('cluster')) {
        drawClusterCircleIcon(this.layerIconElement.nativeElement, this.colorLegend, this.strokeColorLegend);
      }
      break;
    }
    case 'line': {
      if (source.startsWith('feature-metric')) {
        drawLineIcon(this.layerIconElement.nativeElement, this.colorLegend, this.lineDasharray, true);
      } else {
        drawLineIcon(this.layerIconElement.nativeElement, this.colorLegend, this.lineDasharray);
      }
      break;
    }
    case 'fill': {
      if (source.startsWith('cluster')) {
        drawClusterFillIcon(this.layerIconElement.nativeElement, this.colorLegend, this.strokeColorLegend);
      } else if (source.startsWith('feature-metric')) {
        drawFeatureFillIcon(this.layerIconElement.nativeElement, this.colorLegend, this.strokeColorLegend, true);
      } else {
        drawFeatureFillIcon(this.layerIconElement.nativeElement, this.colorLegend, this.strokeColorLegend);
      }
      break;
    }
    case 'heatmap': {
      drawHeatmapIcon(this.layerIconElement.nativeElement, this.colorLegend, this.layer.source.toString().startsWith('feature-metric'));
      break;
    }
    case 'symbol': {
      const l: mapboxgl.SymbolLayout = (this.layer.layout as mapboxgl.SymbolLayout);
      if (l['text-field']) {
        drawTextIcon(this.layerIconElement.nativeElement, this.colorLegend);
      }
    }
    }
  }

}

/**
 * draws the rectangles icon for cluster mode
 * @param svgNode SVG element on which we append the rectangles using d3.
 * @param colorLegend Color legend, to give the drawn icons rectangles the same color on the map
 */
export function drawClusterFillIcon(svgNode: SVGElement, colorLegend: Legend, strokeColorLegend: Legend) {
  const fillFourColors = getClusterFillColors(colorLegend);
  let strokeFourColors = fillFourColors;
  if (strokeColorLegend) {
    strokeFourColors = getClusterFillColors(strokeColorLegend);
  }
  const svg = select(svgNode);
  svg.selectAll('g').remove();
  svg.append('g').append('rect')
    .attr('height', 7).attr('width', 7)
    .attr('fill', fillFourColors[0]).attr('fill-opacity', 0.8)
    .attr('stroke', strokeFourColors[0]).attr('stroke-width', 0.6)
    .attr('y', 3).attr('x', 3);
  svg.append('g').append('rect')
    .attr('height', 7).attr('width', 7)
    .attr('fill', fillFourColors[1]).attr('fill-opacity', 0.6)
    .attr('stroke', strokeFourColors[1]).attr('stroke-width', 0.6)
    .attr('y', 10).attr('x', 3);
  svg.append('g').append('rect')
    .attr('height', 7).attr('width', 7)
    .attr('fill', fillFourColors[2]).attr('fill-opacity', 0.6)
    .attr('stroke', strokeFourColors[2]).attr('stroke-width', 0.6)
    .attr('y', 10).attr('x', 10);
  svg.append('g').append('rect')
    .attr('height', 7).attr('width', 7)
    .attr('fill', fillFourColors[3]).attr('fill-opacity', 0.6)
    .attr('stroke', strokeFourColors[3]).attr('stroke-width', 0.6)
    .attr('y', 3).attr('x', 10);
}

/**
 * draws the rectangles icon for feature and feature-metric modes
 * @param svgNode SVG element on which we append the rectangles using d3.
 * @param colorLegend Color legend, to give the drawn icons rectangles the same color on the map **/
export function drawFeatureFillIcon(svgNode: SVGElement, colorLegend: Legend, strokeColorLegend: Legend, isMetric = false) {
  const fillColor = getOneColor(colorLegend);
  let strokeColor = fillColor;
  if (strokeColorLegend) {
    strokeColor = getOneColor(strokeColorLegend);
  }
  const polygon = [{ 'x': 0, 'y': 0 },
    { 'x': 18, 'y': 0 },
    { 'x': 13, 'y': 15 },
    { 'x': 1, 'y': 15 },
    { 'x': 8, 'y': 7 },
    { 'x': 0, 'y': 0 }];
  const svg = select(svgNode);
  svg.selectAll('g').remove();
  svg.append('g').selectAll('polygon')
    .data([polygon])
    .enter().append('polygon')
    .attr('points', (d) => d.map(d => [d.x, d.y].join(',')).join(' ')).attr('fill', fillColor)
    .attr('fill-opacity', 0.5)
    .attr('stroke', strokeColor)
    .attr('stroke-width', 0.9);
  if (isMetric) {
    svg.append('g').append('text').text('∑')
      .attr('x', 14).attr('y', 14).attr('font-size', '0.5em').attr('font-weight', 'bold').attr('fill', colorLegend.fixValue);
  }
}


export function getOneColor(legend: Legend): string {
  let color = '';
  if (legend.type === PROPERTY_SELECTOR_SOURCE.interpolated) {
    const iv = legend.interpolatedValues;
    color = iv[0] + '';
  } else if (legend.type === PROPERTY_SELECTOR_SOURCE.fix) {
    color = legend.fixValue + '';
  } else if (legend.type === PROPERTY_SELECTOR_SOURCE.manual || legend.type === PROPERTY_SELECTOR_SOURCE.generated
    || legend.type === PROPERTY_SELECTOR_SOURCE.provided) {
    const mv = legend.manualValues as Map<string, string>;
    color = mv.values().next().value;
  }
  return color;
}


export function drawTextIcon(svgNode: SVGElement, colorLegend: Legend) {
  const svg = select(svgNode);
  svg.selectAll('g').remove();
  svg.append('g').append('text').text(' T ').attr('transform', ' translate(5 0)')
    .attr('y', 14).attr('font-size', '0.9em').attr('font-family', 'Garamond').attr('fill', colorLegend.fixValue);
}
/**
 * draws the heatmap icon for cluster mode
 * @param svgNode SVG element on which we append the heamap circles using d3.
 * @param colorLegend Color legend, to give the drawn icons circles the same color on the map
 */
export function drawHeatmapIcon(svgNode: SVGElement, colorLegend: Legend, small: boolean) {
  const heatmapColors = [];
  if (colorLegend.type === PROPERTY_SELECTOR_SOURCE.interpolated) {
    const iv = colorLegend.interpolatedValues;
    if (iv) {
      if (iv.length === 1) {
        heatmapColors.push(iv[0], iv[0], iv[0]);
      } else if (iv.length === 2) {
        heatmapColors.push(iv[0], iv[0], iv[1]);
      } else if (iv.length === 3) {
        heatmapColors.push(iv[1], iv[Math.trunc(iv.length / 2)], iv[iv.length - 1]);
      } else if (iv.length >= 4) {
        heatmapColors.push(iv[1], iv[Math.trunc(iv.length / 3)], iv[Math.trunc(2 * iv.length / 3)], iv[iv.length - 1]);
      }
    }
  }
  const svg = select(svgNode);
  svg.selectAll('defs').remove();
  svg.append('defs')
    .append('filter').attr('id', 'blur')
    .append('feGaussianBlur').attr('stdDeviation', 0.8);
  if (small) {
    svg.selectAll('g').remove();
    svg.append('g')
      .append('circle')
      .attr('cx', 10).attr('cy', 10)
      .attr('r', 7)
      .style('fill', heatmapColors[0])
      .attr('filter', 'url(#blur)');
  } else {
    svg.selectAll('circle').remove();
    svg.selectAll('circle')
      .data(heatmapColors).enter()
      .append('circle')
      .attr('cx', 10).attr('cy', 10)
      .attr('r', (d, i) => {
        if (i === 0) {
          return 10;
        }
        if (i === 1) {
          return 8;
        }
        if (i === 2) {
          return 6;
        }
        if (i === 3) {
          return 3;
        }
      })
      .style('fill', (d, i) => d)
      .attr('filter', 'url(#blur)');
  }
}
/**
 * draws the line icon for feature mode
 * @param svgNode SVG element on which we append the line using d3.
 * @param colorLegend Color legend, to give the drawn icons line the same color on the map
 */
export function drawLineIcon(svgNode: SVGElement, colorLegend: Legend, dashArray, isMetric = false) {
  let lineColor = '';
  if (colorLegend.type === PROPERTY_SELECTOR_SOURCE.fix) {
    lineColor = colorLegend.fixValue + '';
  } else if (colorLegend.type === PROPERTY_SELECTOR_SOURCE.interpolated) {
    const iv = colorLegend.interpolatedValues;
    if (iv) {
      lineColor = iv[0] + '';
    } else {
      lineColor = '#2da4ff';
    }
  } else if (colorLegend.type === PROPERTY_SELECTOR_SOURCE.manual || colorLegend.type === PROPERTY_SELECTOR_SOURCE.generated
    || colorLegend.type === PROPERTY_SELECTOR_SOURCE.provided) {
    const mv = colorLegend.manualValues as Map<string, string>;
    lineColor = mv.values().next().value;
  }
  let svgDashArray = '0';
  if (!!dashArray && dashArray.length > 1) {
    const joinedDashArray = dashArray.join(',');
    if (joinedDashArray === '2,5') {
      svgDashArray = '0, 2, 3';
    } else if (joinedDashArray === '0.1,5') {
      svgDashArray = '1,2.5';
    } else {
      svgDashArray = '4,2,1';
    }
  }
  const svg = select(svgNode);
  svg.selectAll('g').remove();
  svg.append('g').append('line')
    .attr('x1', 0).attr('y1', 18)
    .attr('x2', 6).attr('y2', 10)
    .attr('cx', 2).attr('cy', 2)
    .attr('stroke', lineColor).attr('stroke-width', 1.5).attr('stroke-dasharray', svgDashArray);
  svg.append('g').append('line')
    .attr('x1', 6).attr('y1', 10)
    .attr('x2', 12).attr('y2', 4)
    .attr('cx', 2).attr('cy', 2)
    .attr('stroke', lineColor).attr('stroke-width', 1.5).attr('stroke-dasharray', svgDashArray);
  svg.append('g').append('line')
    .attr('x1', 12).attr('y1', 4)
    .attr('x2', 18).attr('y2', 0)
    .attr('cx', 2).attr('cy', 2)
    .attr('stroke', lineColor).attr('stroke-width', 1.5).attr('stroke-dasharray', svgDashArray);
  if (isMetric) {
    svg.append('g').append('text').text('∑')
      .attr('x', 10).attr('y', 16).attr('font-size', '0.5em').attr('font-weight', 'bold').attr('fill', colorLegend.fixValue);
  }
}
/**
 * draws the circle icon for feature mode
 * @param svgNode SVG element on which we append the circles using d3.
 * @param colorLegend Color legend, to give the drawn icons circles the same color on the map
 */
export function drawFeatureCircleIcon(svgNode: SVGElement, colorLegend: Legend, strokeColorLegend: Legend, isMetric = false) {
  const colorsList = [];
  const strokeColorsList = [];
  populateListFromLegend(colorsList, colorLegend);
  populateListFromLegend(strokeColorsList, strokeColorLegend);

  const svg = select(svgNode);
  svg.selectAll('circle').remove();
  svg.selectAll('g').remove();
  svg.selectAll('circle')
    .data(colorsList).enter()
    .append('circle')
    .attr('cx', (d, i) => {
      if (colorsList.length === 1) {
        return 10;
      } else {
        if (i === 0) {
          return 6;
        }
        if (i === 1) {
          return 12;
        }
        if (i === 2) {
          return 5;
        }
      }
    })
    .attr('cy', (d, i) => {
      if (colorsList.length === 1) {
        return 10;
      } else {
        if (i === 0) {
          return 5;
        }
        if (i === 1) {
          return 10;
        }
        if (i === 2) {
          return 15;
        }
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
    .style('stroke', (d, i) => strokeColorsList[i]).style('stroke-width', 0.5);

  if (isMetric) {
    svg.append('g').append('text').text('∑')
      .attr('x', 10).attr('y', 16).attr('font-size', '0.5em').attr('font-weight', 'bold').attr('fill', colorLegend.fixValue);
  }
}


/**
 * draws the circle icon for cluster mode
 * @param svgNode SVG element on which we append the circles using d3.
 * @param colorLegend Color legend, to give the drawn icons circles the same color on the map
 */
export function drawClusterCircleIcon(svgNode: SVGElement, colorLegend: Legend, strokeColorLegend: Legend) {
  // todo include radius legend in drawing icons
  const colorsList = [];
  const strokeColorsList = [];
  populateListFromLegend(colorsList, colorLegend);
  populateListFromLegend(strokeColorsList, strokeColorLegend);
  const svg = select(svgNode);
  svg.selectAll('circle').remove();
  svg.selectAll('circle')
    .data(colorsList).enter()
    .append('circle')
    .attr('cx', (d, i) => {
      if (i === 0) {
        return 12;
      }
      if (i === 1) {
        return 6;
      }
      if (i === 2) {
        return 10;
      }
    })
    .attr('cy', (d, i) => {
      if (i === 0) {
        return 7;
      }
      if (i === 1) {
        return 11;
      }
      if (i === 2) {
        return 15;
      }
    })
    .attr('r', (d, i) => {
      if (i === 0) {
        return 6;
      }
      if (i === 1) {
        return 5;
      }
      if (i === 2) {
        return 3;
      }
    })
    .style('fill', (d, i) => d).style('fill-opacity', 0.7)
    .style('stroke', (d, i) => strokeColorsList[i]).style('stroke-width', 0.8);
}



export function populateListFromLegend(list: Array<string | number>, legend: Legend) {
  if (legend.type === PROPERTY_SELECTOR_SOURCE.fix) {
    list.push(legend.fixValue);
    list.push(legend.fixValue);
    list.push(legend.fixValue);
  } else if (legend.type === PROPERTY_SELECTOR_SOURCE.interpolated) {
    const iv = legend.interpolatedValues;
    if (iv) {
      if (iv.length === 1) {
        list.push(iv[0], iv[0], iv[0]);
      } else if (iv.length === 2) {
        list.push(iv[0], iv[0], iv[1]);
      } else if (iv.length >= 3) {
        list.push(iv[0], iv[Math.trunc(iv.length / 2)], iv[iv.length - 1]);
      }
    }
  } else if (legend.type === PROPERTY_SELECTOR_SOURCE.manual || legend.type === PROPERTY_SELECTOR_SOURCE.generated
    || legend.type === PROPERTY_SELECTOR_SOURCE.provided) {
    const iv = legend.manualValues as Map<string, string>;
    if (iv) {
      if (iv.size === 1) {
        const color = iv.values().next().value;
        list.push(color, color, color);
      } else if (iv.size === 2) {
        list.push(Array.from(iv.values())[0], Array.from(iv.values())[0], Array.from(iv.values())[1]);
      } else if (iv.size >= 3) {
        list.push(Array.from(iv.values())[0], Array.from(iv.values())[Math.trunc(Array.from(iv.keys()).length / 2)],
          Array.from(iv.values())[Array.from(iv.keys()).length - 1]);
      }
    } else if (!iv || iv.size === 0) {
      list.push('#eee', '#eee', '#eee');
    }
  }
}

export function getClusterFillColors(colorLegend: Legend): string[] {
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
  } else if (colorLegend.type === PROPERTY_SELECTOR_SOURCE.fix) {
    const c = colorLegend.fixValue;
    fourColors.push(c, c, c, c);
  }
  return fourColors;
}
