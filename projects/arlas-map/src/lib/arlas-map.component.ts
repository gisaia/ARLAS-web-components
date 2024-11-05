import { Component, Input, OnInit } from '@angular/core';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { MapLayers } from 'arlas-map';
import { AbstractDraw } from 'arlas-map';
import { AbstractArlasMapGL } from 'arlas-map';
import { Subscription } from 'rxjs';

@Component({
  selector: 'lib-arlas-map',
  template: `
    <p>
      arlas-map works!
    </p>
  `,
  styles: [
  ]
})
export class ArlasMapComponent implements OnInit {

  /** Map instance. */
  public map: AbstractArlasMapGL;
  /** Draw instance. */
  public draw: AbstractDraw;
  /** Whether the legend is visible (open) or not.*/
  public legendOpen = true;
  /** DEAD CODE TO REMOVE. KEPT TO THE END OF REFACTOR !!! */
  private index: any;
  /** Set to true when the user is drawing a bbox. */
  protected isDrawingBbox = false;
  /** Drawn geometry's state when editing/updating. */
  protected savedEditFeature = null;
  /** Map container Html element? */
  protected canvas: HTMLElement;
  /** Canvas of the bbox while being drawn. This variable is set to undefined when the draw ends. */
  private box: HTMLElement;
  /** Point coordinates when the bbox drawing starts*/
  protected start: unknown /** it's either mapbox or maplibre Point */;
  /** Point coordinates when the bbox drawing is being drawn. Changes at move.*/
  protected current: mapboxgl.Point;
  /** Message shown to explain how to end drawing. */
  public FINISH_DRAWING = marker('Double click to finish drawing');
  /** Subscribtion to protomaps basemaps change. Should be unsbscribed when this component is destroyed. */
  protected offlineBasemapChangeSubscription!: Subscription;

  /** ANGULAR INPUTS */

  /** @description Html identifier given to the map container (it's a div ;))*/
  @Input() public id = 'mapgl';

  /** @description List of configured (by the builder) layers. */
  @Input() public mapLayers: MapLayers<unknown>;

  /** @description Whether the map scale is displayed. */
  @Input() public displayScale = true;

  /** @description Maximim width in pixels that the map scale could take. */
  @Input() public maxWidthScale = 100;

  /** @description Unit display for the map scale. */
  @Input() public unitScale = 'metric';

  /** @description Whether to display the coordinates of the mouse while moving. */
  @Input() public displayCurrentCoordinates = false;

  /** @description If true, the coordinates values are wrapped between -180 and 180. */
  @Input() public wrapLatLng = true;

  constructor() { }

  ngOnInit(): void {
  }

}
