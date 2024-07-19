import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Legend, PROPERTY_SELECTOR_SOURCE } from '../../mapgl/mapgl.component.util';
import { Layer } from 'mapbox-gl';

@Component({
  selector: 'arlas-mapgl-legend-item',
  templateUrl: './mapgl-legend-item.component.html',
  styleUrls: ['./mapgl-legend-item.component.scss']
})
export class MapglLegendItemComponent implements OnInit {
  @Input() public legend: Legend;
  @Input() public title: string;
  @Input() public layer: Layer;
  // TODO: check type
  @Input() public colorPalette: string;
  @ViewChild('interpolated_svg', { read: ElementRef, static: false }) public interpolatedElement: ElementRef;

  protected PROPERTY_SELECTOR_SOURCE = PROPERTY_SELECTOR_SOURCE;

  public constructor() { }

  public ngOnInit(): void {
  }

}
