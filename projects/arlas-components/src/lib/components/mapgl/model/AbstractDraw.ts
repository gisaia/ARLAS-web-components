import { Feature } from 'geojson';
import { Geometry, GeometryCollection, Properties } from '@turf/helpers/dist/js/lib/geojson';

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

  public abstract getAllFeatures():  Array<unknown>;

  public abstract onDrawCreate(args): void;

  public abstract on(event: string, func: (e) => void): void;

  public abstract onDrawDelete(args): void;

  public abstract onDrawEditSaveInitialFeature(args): void;

  public abstract onDrawInvalidGeometry(args): void;

  public abstract onDrawModeChange(args): void;

  public abstract onDrawOnClick(args): void;

  public abstract onDrawOnStart(args): void;

  public abstract onDrawOnStop(args): void;

  public abstract onDrawSelectionchange(args): void;

  public abstract onDrawUpdate(args): void;

  public abstract setMode(mode: any,  replaceMode: string): void;

}
