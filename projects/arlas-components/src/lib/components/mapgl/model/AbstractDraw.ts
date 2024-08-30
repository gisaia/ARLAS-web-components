import { Feature } from "geojson";
import { Geometry, GeometryCollection, Properties } from "@turf/helpers/dist/js/lib/geojson";

export interface DrawEvents {
  onDrawCreate: (...args) => void;
  onDrawUpdate: (...args) => void;
  onDrawDelete: (...args) => void;
  onDrawOnClick: (...args) => void;
  onDrawOnStart: (...args) => void;
  onDrawOnStop: (...args) => void;
  onDrawInvalidGeometry: (...args) => void;
  onDrawEditSaveInitialFeature: (...args) => void;
  onDrawSelectionchange: (...args) => void;
  onDrawModeChange: (...args) => void;
}

export abstract class AbstractDraw implements DrawEvents {
  protected config;

  abstract getAllFeatures():  Array<unknown>;

  abstract onDrawCreate(args): void;

  abstract on(event:string, func: (e) => void): void;

  abstract onDrawDelete(args): void;

  abstract onDrawEditSaveInitialFeature(args): void;

  abstract onDrawInvalidGeometry(args): void;

  abstract onDrawModeChange(args): void;

  abstract onDrawOnClick(args): void;

  abstract onDrawOnStart(args): void;

  abstract onDrawOnStop(args): void;

  abstract onDrawSelectionchange(args): void;

  abstract onDrawUpdate(args): void;

  abstract setMode(mode: any,  replaceMode: string): void;

}
