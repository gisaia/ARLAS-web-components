import { Component, OnInit, Input, AfterViewInit, SimpleChanges, OnChanges, ElementRef, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { curveLinear, area } from 'd3-shape';
import { scaleLinear, ScaleLinear } from 'd3-scale';
import { axisLeft, axisBottom } from 'd3-axis';
import { select } from 'd3-selection';
import { HistogramData } from 'arlas-d3/histograms/utils/HistogramUtils';


export const GET = 'get';
export const MATCH = 'match';
export const INTERPOLATE = 'interpolate';
export const OTHER = 'other_color';
@Component({
  selector: 'arlas-mapgl-legend',
  templateUrl: './mapgl-legend.component.html',
  styleUrls: ['./mapgl-legend.component.css']
})
export class MapglLegendComponent implements OnInit, AfterViewInit, OnChanges {

  @Input() public layer: mapboxgl.Layer;
  @Input() public legendContent: Subject<Map<string, {min: number, max: number}>>;
  @ViewChild('width_svg', { read: ElementRef, static: false }) public widthSvg: ElementRef;


  public manualColors: Map<string, string> = new Map();
  public interpolatedColors: Array<string> = new Array();

  public colorType: PROPERTY_SELECTOR_SOURCE;
  public widthType: PROPERTY_SELECTOR_SOURCE;
  public PROPERTY_SELECTOR_SOURCE = PROPERTY_SELECTOR_SOURCE;
  constructor(public translate: TranslateService, private el: ElementRef) { }

  public ngOnInit() {
  }

  public ngAfterViewInit() {
    if (this.layer) {
      this.getLegends();
    }
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes['layer'] !== undefined) {
      if (this.layer) {
        this.getLegends();
      }
    }
  }
  private getLegends(): void {
    const type = this.layer.type;
    const paint = this.layer.paint;

    switch (type) {
      case 'circle': {
        const color = (paint as mapboxgl.CirclePaint)['circle-color'];
        if (typeof color === 'string') {
          this.colorType = PROPERTY_SELECTOR_SOURCE.fix;
        } else if (Array.isArray(color)) {
          if (color.length === 2) {
            /** color = ["get", "field"]  ==> Generated or Provided */
            // todo
          } else if (color.length >= 3) {
            if (color[0] === MATCH) {
              /** color = ["match", ["get", "field"], .... ]**/
              this.colorType = PROPERTY_SELECTOR_SOURCE.manual;
              const colorsLength = color.length - 2;
              let hasDefaultColor = false;
              if (colorsLength % 2 !== 0) {
                hasDefaultColor = true;
              }
              for (let i = 2; i < color.length; i += 2) {
                if (hasDefaultColor && i === colorsLength - 1) {
                  this.manualColors.set(this.translate.instant(OTHER), color[i]);
                } else {
                  this.manualColors.set(this.translate.instant(color[i]), color[i + 1]);
                }
              }
            } else if (color[0] === INTERPOLATE) {
              this.colorType = PROPERTY_SELECTOR_SOURCE.interpolated;
              /** color = ["interplate", ['linear'], ["get", "field"], 0, 1... ]**/
              // todo throw exception if interpolation is not linear
              this.interpolatedColors = color.filter((c, i) => i > 2 && i % 2 === 0);
            }
          }
        }
        break;
      }
      case 'line': {
        const p: mapboxgl.LinePaint = (paint as mapboxgl.LinePaint);
        const color = p['line-color'];
        if (typeof color === 'string') {
          this.colorType = PROPERTY_SELECTOR_SOURCE.fix;
        } else if (Array.isArray(color)) {
          if (color.length === 2) {
            /** color = ["get", "field"]  ==> Generated or Provided */
            // todo
          } else if (color.length >= 3) {
            if (color[0] === MATCH) {
              /** color = ["match", ["get", "field"], .... ]**/
              this.colorType = PROPERTY_SELECTOR_SOURCE.manual;
              const colorsLength = color.length - 2;
              let hasDefaultColor = false;
              if (colorsLength % 2 !== 0) {
                hasDefaultColor = true;
              }
              for (let i = 2; i < color.length; i += 2) {
                if (hasDefaultColor && i === colorsLength - 1) {
                  this.manualColors.set(this.translate.instant(OTHER), color[i]);
                } else {
                  this.manualColors.set(this.translate.instant(color[i]), color[i + 1]);
                }
              }
            } else if (color[0] === INTERPOLATE) {
              this.colorType = PROPERTY_SELECTOR_SOURCE.interpolated;
              /** color = ["interplate", ['linear'], ["get", "field"], 0, 1... ]**/
              // todo throw exception if interpolation is not linear
              this.interpolatedColors = color.filter((c, i) => i > 2 && i % 2 === 0);
            }
          }
        }


        const lineWidth = p['line-width'];
        if (typeof lineWidth === 'number') {

        } else if (Array.isArray(lineWidth)) {
          if (lineWidth.length >= 3) {
            if (lineWidth[0] === INTERPOLATE) {
              this.widthType = PROPERTY_SELECTOR_SOURCE.interpolated;
              const data: Array<HistogramData> = new Array();
              lineWidth.filter((w, i) => i >= 3).forEach((w, i) => {
                if (i % 2 !== 0) {
                  data.push({key: w, value: lineWidth[i + 1 + 3]});
                }
              });
              lineWidthLegend(this.widthSvg.nativeElement, data, 300);
            }
          }
        }
        break;
      }
    }
  }

}
export function lineWidthLegend(svgNode: SVGElement, data: Array<HistogramData>, width: number) {
  const maxHeight = data[data.length - 1].value;
  const xDomain: any = (scaleLinear()).range([0, width]);
  const xDomainExtent = [data[0].key, data[data.length - 1].key];
  xDomain.domain(xDomainExtent);
  const yDomain: ScaleLinear<number, number> = scaleLinear().range([maxHeight, 0]);
  yDomain.domain([0, maxHeight]);
  const svg = select(svgNode);
  const context = svg.append('g').attr('class', 'context');
  // context.append('g')
  //     .call(axisBottom(xDomain).tickSize(0));
  // context.append('g')
  //   .call(axisLeft(yDomain).tickSize(0).ticks(0));
  const ar = area()
      .curve(curveLinear)
      .x((d: any) => xDomain(d.key))
      .y0(maxHeight)
      .y1((d: any) => yDomain(d.value));

  context
      .append('path')
      .datum(data)
      .attr('class', 'histogram__chart--unselected--area')
      .attr('d', <any>ar);
}
export enum PROPERTY_SELECTOR_SOURCE {
  fix = 'Fix',
  provided = 'Provided',
  generated = 'Generated',
  manual = 'Manual',
  interpolated = 'Interpolated',
  metric_on_field = 'Metric on field',
  heatmap_density = 'Density'
}
