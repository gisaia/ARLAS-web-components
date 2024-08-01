import { BaseDrawGL } from "./BaseDrawGL";
import MapboxDraw from '@mapbox/mapbox-gl-draw';

export abstract class ArlasDrawGL  extends BaseDrawGL {
  protected draw: MapboxDraw;
  protected constructor(draw: MapboxDraw) {
    super(draw);
    this.init();
  }
  init(): void {
    this.draw.modes.DRAW_CIRCLE = 'draw_circle';
    this.draw.modes.DRAW_RADIUS_CIRCLE = 'draw_radius_circle';
    this.draw.modes.DRAW_STRIP = 'draw_strip';
    this.draw.modes.DIRECT_STRIP = 'direct_strip';
  }
}
