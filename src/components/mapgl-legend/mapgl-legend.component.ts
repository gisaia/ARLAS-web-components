import { Component, OnInit, Input, AfterViewInit, SimpleChanges, OnChanges } from '@angular/core';
import { Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { ColorFormats } from 'tinycolor2';

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


  public manualColors: Map<string, string> = new Map();
  public interpolatedColors: Array<string> = new Array();

  public colorType: PROPERTY_SELECTOR_SOURCE;
  public PROPERTY_SELECTOR_SOURCE = PROPERTY_SELECTOR_SOURCE;
  constructor(public translate: TranslateService) { }

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
        break;
      }
    }
  }

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
