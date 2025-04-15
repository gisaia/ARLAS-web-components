/*
 * Licensed to Gisaïa under one or more contributor
 * license agreements. See the NOTICE.txt file distributed with
 * this work for additional information regarding copyright
 * ownership. Gisaïa licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {
  AfterViewInit, Component, computed, Input, OnChanges, OnInit, Output, signal, SimpleChanges, ViewChild, WritableSignal
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { HistogramData } from 'arlas-d3/histograms/utils/HistogramUtils';
import { ArlasColorService } from 'arlas-web-components';
import { scaleLinear, ScaleLinear } from 'd3-scale';
import { select } from 'd3-selection';
import { area, curveLinear, line } from 'd3-shape';
import { Subject, takeUntil } from 'rxjs';
import { ARLAS_ID, ArlasDataLayer, FILLSTROKE_LAYER_PREFIX, HOVER_LAYER_PREFIX, SELECT_LAYER_PREFIX } from '../map/model/layers';
import { Legend, LegendData, PROPERTY_SELECTOR_SOURCE } from './legend.config';
import { LegendService } from './legend.service';
import { getMax, MAX_LINE_WIDTH } from './legend.tools';


@Component({
  selector: 'arlas-legend',
  templateUrl: './legend.component.html',
  styleUrls: ['./legend.component.scss']
})
export class LegendComponent implements OnInit, AfterViewInit, OnChanges {
  /**
   * @Input : Angular
   * @description Layer object
   */
  @Input() public layer: ArlasDataLayer;
  /**
   * @Input : Angular
   * @description Collection of the layer
   */
  @Input() public collection: string;
  /**
   * @Input : Angular
   * @description Current zoom level of the map
   */
  @Input() public zoom: number;
  /**
   * @Input : Angular
   * @description Whether the layer is enabled.
   */
  @Input() public enabled: boolean;
  /**
   * @Input : Angular
   * @description Subject of [collection, [field, legendData]] map. The map subscribes to it to keep
   * the legend updated with the data displayed on the map.
   */
  @Input() public legendUpdater: Subject<Map<string, Map<string, LegendData>>> = new Subject();
  /**
   * @Input : Angular
   * @description Subject of [field, boolean] map. The map subscribes to it to keep
   * the legend updated with the visibility of the layer.
   */
  @Input() public visibilityUpdater: Subject<Map<string, boolean>> = new Subject();
  /**
   * @Input : Angular
   * @description Whether to highlight the keywords or color of hovered features
   */
  @Input() public highlightLegend = true;

  /**
   * @Output : Angular
   * @description Notifies the parent component that this layer is visible or not
   */
  @Output() public visibilityStatus: Subject<boolean> = new Subject();

  /**
   * @Output : Angular
   * @description Notifies the parent component that the user wants to download the layer
   */
  @Output() public downloadSourceEmitter: Subject<{ layer: any; downloadType: string; }> = new Subject();

  @ViewChild('width_legend', { static: false }) public lineWidthLegend: any;
  @ViewChild('radius_legend', { static: false }) public circleRadiusLegend: any;

  public lineDasharray: Array<number>;

  public colorLegend: WritableSignal<Legend> = signal({});
  public hasColorLegend = computed(() => this.colorLegend().type !== undefined && this.colorLegend().type !== 'Fix');

  public strokeColorLegend: WritableSignal<Legend> = signal({});
  public hasStrokeLegend = computed(() => this.strokeColorLegend().type !== undefined && this.strokeColorLegend().type !== 'Fix');

  public widthLegend: WritableSignal<Legend> = signal({});
  public hasWidthLegend = computed(() => this.widthLegend().type !== undefined && this.widthLegend().type !== 'Fix');

  public radiusLegend: WritableSignal<Legend> = signal({});
  public hasRadiusLegend = computed(() => this.radiusLegend().type !== undefined && this.radiusLegend().type !== 'Fix');

  public displayLegendDetailToggle = computed(() =>
    this.hasColorLegend() || this.hasStrokeLegend() || this.hasWidthLegend() || this.hasRadiusLegend());

  public detail = false;
  public visibleMode = false;
  public PROPERTY_SELECTOR_SOURCE = PROPERTY_SELECTOR_SOURCE;

  private legendData: Map<string, LegendData> = new Map();
  public colorPalette = '';
  public strokeColorPalette = '';

  private readonly MAX_CIRLE_RADIUS = 7;
  private readonly LEGEND_WIDTH = 210;
  private readonly _onDestroy$ = new Subject<boolean>();

  public constructor(
    public translate: TranslateService,
    public colorService: ArlasColorService,
    private readonly legendService: LegendService
  ) { }

  public ngOnInit() {
    this.legendUpdater
      .pipe(takeUntil(this._onDestroy$))
      .subscribe(legendDataPerCollection => {

        this.legendData = legendDataPerCollection.get(this.collection);
        if (this.layer) {
          this.drawLegends(this.visibleMode);
        }
      });
    this.visibilityUpdater
      .pipe(takeUntil(this._onDestroy$))
      .subscribe(visibilityUpdater => {
        /** check legend visibility according to Data source status (mapcontirbutor) */
        if (this.layer) {
          /** if the visibility updater contains the layer we pick the visibility status otherwise we keep it unchaged */
          this.visibleMode = visibilityUpdater.get(this.layer.id) !== undefined ? visibilityUpdater.get(this.layer.id) : this.visibleMode;
        } else {
          this.visibleMode = false;
        }
        /** check legend visibility according to VisibilityRules */
        if (this.visibleMode && this.layer && !!this.layer.minzoom && !!this.layer.maxzoom) {
          this.visibleMode = (this.zoom <= this.layer.maxzoom && this.zoom >= this.layer.minzoom);
        }
        /** check legend visibility according to legend enabled or not */
        if (!this.enabled) {
          this.visibleMode = false;
        }
        if (!this.visibleMode) {
          this.detail = this.visibleMode;
        }
        /** check legend visibility for external layers that are not set by config nor map contributors */
        if (this.layer && !this.layer.id.startsWith(ARLAS_ID) &&
          !this.layer.id.startsWith(FILLSTROKE_LAYER_PREFIX) && !this.layer.id.startsWith(HOVER_LAYER_PREFIX)
          && !this.layer.id.startsWith(SELECT_LAYER_PREFIX)) {
          this.visibleMode = this.enabled;
          if (!!this.layer.metadata && this.layer.metadata.showLegend === false) {
            this.visibleMode = false;
          }
        }
        if (this.layer) {
          this.drawLegends(this.visibleMode);
        }
        this.visibilityStatus.next(this.visibleMode);
      });
  }

  public ngAfterViewInit() {
    if (this.layer) {
      this.drawLegends(this.visibleMode);
    }
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes['layer'] !== undefined) {
      if (this.layer) {
        this.drawLegends(this.visibleMode);
      }
    }
  }

  public ngOnDestroy() {
    this._onDestroy$.next(true);
    this._onDestroy$.complete();
  }

  public downloadLayerSource(layer: any, downloadType: string): void {
    const download = {
      layer,
      downloadType
    };
    this.downloadSourceEmitter.next(download);
  }

  public showDetail(event: Event) {
    this.detail = !this.detail;
    event.stopPropagation();
  }

  /** Parses the `paint` attribute of a layer and draws the legend elements such as
   * - color palette
   * - line width evolution
   * - circle radius evolution
   */
  private drawLegends(visibileMode: boolean): void {
    const type = this.layer.type;
    const paint = this.layer.paint;
    switch (type) {
      case 'circle': {
        const circleLegend = this.legendService.getCircleLegend(paint, visibileMode, this.legendData, this.layer);
        this.colorLegend.set(circleLegend.color);

        // For circle-heatmap layer the stroke can't be configured, so hide it
        if (this.layer.metadata?.hiddenProps?.geomType !== 'circle-heatmap') {
          this.strokeColorLegend.set(circleLegend.strokeColor);
        }
        this.colorPalette = circleLegend.colorPalette;
        this.strokeColorPalette = circleLegend.strokeColorPalette;
        this.radiusLegend.set(circleLegend.radius);
        if (this.circleRadiusLegend?.interpolatedElement) {
          const circleRadiusEvolution = circleLegend.radius.histogram;
          drawCircleSupportLine(this.circleRadiusLegend.interpolatedElement.nativeElement, circleRadiusEvolution, this.colorLegend(),
            this.LEGEND_WIDTH, Math.min(this.MAX_CIRLE_RADIUS, getMax(circleRadiusEvolution)) * 2);
        }
        break;
      }
      case 'line': {
        const lineLegend = this.legendService.getLineLegend(paint, visibileMode, this.legendData, this.layer);
        this.lineDasharray = lineLegend.dashes;
        this.colorLegend.set(lineLegend.color);
        this.colorPalette = lineLegend.colorPalette;
        this.widthLegend.set(lineLegend.width);
        if (this.lineWidthLegend?.interpolatedElement) {
          const lineWidthEvolution = lineLegend.width.histogram;
          drawLineWidth(this.lineWidthLegend.interpolatedElement.nativeElement, lineWidthEvolution, this.colorLegend(),
            this.LEGEND_WIDTH, MAX_LINE_WIDTH);
        }
        break;
      }
      case 'fill': {
        const fillLegend = this.legendService.getFillLegend(paint, visibileMode, this.legendData, this.layer);
        this.colorLegend.set(fillLegend.color);
        this.colorPalette = fillLegend.colorPalette;
        this.strokeColorLegend.set(fillLegend?.strokeColor);
        this.strokeColorPalette = fillLegend?.strokeColorPalette;
        break;
      }
      case 'heatmap': {
        const heatmapLegend = this.legendService.getHeatmapLegend(paint, visibileMode, this.legendData, this.layer);

        this.colorLegend.set(heatmapLegend.color);
        this.colorPalette = heatmapLegend.colorPalette;
        this.radiusLegend.set(heatmapLegend.radius);
        if (this.circleRadiusLegend?.interpolatedElement) {
          const heatmapRadiusEvolution = heatmapLegend.radius.histogram;
          drawCircleSupportLine(this.circleRadiusLegend.interpolatedElement.nativeElement, heatmapRadiusEvolution, this.colorLegend(),
            this.LEGEND_WIDTH, Math.min(this.MAX_CIRLE_RADIUS, getMax(heatmapRadiusEvolution)) * 2);
        }
        break;
      }
      case 'symbol': {
        const symbolLegend = this.legendService.getLabelLegend(paint, visibileMode, this.legendData, this.layer);
        this.colorLegend.set(symbolLegend.color);
        this.colorPalette = symbolLegend.colorPalette;
        this.widthLegend.set(symbolLegend.size);
        if (!!this.lineWidthLegend && !!this.lineWidthLegend.interpolatedElement) {
          const lineWidthEvolution = symbolLegend.size.histogram;
          drawLineWidth(this.lineWidthLegend.interpolatedElement.nativeElement, lineWidthEvolution, this.colorLegend(),
            this.LEGEND_WIDTH, MAX_LINE_WIDTH);
        }
        break;
      }
    }
    if (!this.colorLegend().fixValue) {
      this.colorLegend().fixValue = visibileMode ? '#444' : '#d3d3d3';
    }
    const layer = { ...this.layer };
    this.layer = null;
    this.layer = { ...layer };
  }


}

/**
 * draws the line width legend
 * @param svgNode SVG element on which we append the line using d3.
 * @param lineWidths List of {key, linewidth}
 * @param cLegend Color legend, to give the drawn legend lines the same color on the map
 * @param legendWidth The width that the svg will take to draw the legend
 * @param legendHeight The height that the svg will take to draw the legend
 */
export function drawLineWidth(svgNode: SVGElement, lineWidths: Array<HistogramData>,
  cLegend: Legend, legendWidth: number, legendHeight: number) {
  const maxHeight = getMax(lineWidths);
  const xDomain: any = (scaleLinear()).range([0, legendWidth]);
  const xDomainExtent = [lineWidths[0].key, lineWidths[lineWidths.length - 1].key];
  xDomain.domain(xDomainExtent);
  const yDomain: ScaleLinear<number, number> = scaleLinear().range([maxHeight, 0]);
  yDomain.domain([0, maxHeight]);
  const svg = select(svgNode).attr('width', legendWidth).attr('height', legendHeight);
  svg.selectAll('g').remove();
  const context = svg.append('g').attr('class', 'context');
  const ar = area()
    .curve(curveLinear)
    .x((d: any) => xDomain(d.key))
    .y0(maxHeight)
    .y1((d: any) => yDomain(d.value));

  const widthLineColor = getMiddleColor(cLegend);
  context.append('path')
    .datum(lineWidths)
    .style('fill', widthLineColor)
    .style('fill-opacity', 0.6)
    .style('stroke', widthLineColor)
    .style('stroke-opacity', 0.6)
    .style('stroke-width', 0.5)
    .attr('d', <any>ar);
}

export function getMiddleColor(colorLegend: Legend): string {
  let color = '';
  if (colorLegend.type === PROPERTY_SELECTOR_SOURCE.fix) {
    color = colorLegend.fixValue as string;
  } else if (colorLegend.type === PROPERTY_SELECTOR_SOURCE.interpolated) {
    const iv = colorLegend.interpolatedValues as Array<string>;
    if (iv.length === 1 || iv.length === 2) {
      color = iv[0];
    } else if (iv.length >= 3) {
      color = iv[Math.trunc(iv.length / 2)];
    }
  } else if (colorLegend.type === PROPERTY_SELECTOR_SOURCE.manual || colorLegend.type === PROPERTY_SELECTOR_SOURCE.generated
    || colorLegend.type === PROPERTY_SELECTOR_SOURCE.provided) {
    const iv = colorLegend.manualValues;
    if (iv) {
      if (iv.size === 1) {
        color = iv.keys().next().value;
      } else if (iv.size >= 2) {
        const values = Array.from(iv.values());
        color = values[Math.trunc(values.length / 2)].color as string;
      }
    }
  }
  return color;
}
/**
 * draws the circle radius legend
 * @param svgNode SVG element on which we append the circles using d3.
 * @param circlesRadiuses List of {key, circleradius}
 * @param cLegend Color legend, to give the drawn legend circles the same color on the map
 * @param legendWidth The width that the svg will take to draw the legend
 * @param legendHeight The height that the svg will take to draw the legend
 */
export function drawCircleSupportLine(svgNode: SVGElement, circlesRadiuses: Array<HistogramData>,
  cLegend: Legend, legendWidth: number, legendHeight: number) {
  const circleDiameters = [];
  circlesRadiuses.forEach(cr => circleDiameters.push({ key: cr.key, value: cr.value * 2 }));
  const maxHeight = getMax(circleDiameters);
  const firstRadius = circlesRadiuses[0].value;
  const lastRadius = circlesRadiuses[circlesRadiuses.length - 1].value;
  const xDomain: any = (scaleLinear()).range([0, legendWidth - firstRadius - lastRadius]);
  const xDomainExtent = [circleDiameters[0].key, circleDiameters[circleDiameters.length - 1].key];
  xDomain.domain(xDomainExtent);
  const yDomain: ScaleLinear<number, number> = scaleLinear().range([maxHeight, 0]);
  yDomain.domain([0, maxHeight]);
  const svg = select(svgNode).attr('width', legendWidth).attr('height', legendHeight);
  svg.selectAll('g').remove();
  const context = svg.append('g').attr('class', 'context');
  const l = line()
    .x((d: any) => xDomain(d.key))
    .y((d: any) => yDomain(d.value));
  context.append('path')
    .datum(circleDiameters)
    .attr('fill', 'none')
    .attr('stroke', '#eaeaea')
    .attr('stroke-width', 0.8)
    .attr('transform', 'translate(' + firstRadius + ', 0)')
    .attr('d', <any>l);
  context.append('g').append('line')
    .attr('x1', 0).attr('y1', maxHeight)
    .attr('x2', legendWidth - firstRadius - lastRadius).attr('y2', maxHeight)
    .attr('cx', 2).attr('cy', 2).attr('fill', 'none')
    .attr('stroke', '#eaeaea')
    .attr('stroke-width', 0.8)
    .attr('transform', 'translate(' + firstRadius + ', 0)');
  const circles = [circlesRadiuses[0], circlesRadiuses[circlesRadiuses.length - 1]];
  const circleColor = getMiddleColor(cLegend);
  context.append('g')
    .selectAll('dot').data(circles).enter().append('circle')
    .attr('r', (d) => d.value)
    .attr('cx', (d) => xDomain(d.key))
    .attr('cy', (d) => maxHeight - d.value)
    .attr('transform', 'translate(' + firstRadius + ', 0)')
    .style('fill', circleColor)
    .style('fill-opacity', 0.6)
    .style('stroke', circleColor)
    .style('stroke-width', 0.5);

}
