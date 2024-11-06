import { Injectable } from '@angular/core';
import { Point } from 'maplibre-gl';

@Injectable({
  providedIn: 'root'
})
export class ArlasMaplibreService {

  constructor() { }

  public getPointFromScreen(e, container: HTMLElement): Point {
    const rect = container.getBoundingClientRect();
    return new Point(
      e.clientX - rect.left - container.clientLeft,
      e.clientY - rect.top - container.clientTop
    );
  };
}
