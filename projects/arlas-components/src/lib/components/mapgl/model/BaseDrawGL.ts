import { MapSource } from "./mapSource";
import { VisualisationSetConfig } from "../mapgl.component";
import { FeatureCollection } from "@turf/helpers";
import { MapExtend } from "../mapgl.component.util";
import { ControlButton } from "../mapgl.component.control";

export abstract class BaseDrawGL {
  draw: unknown;
  protected constructor(draw: unknown) {
    this.draw = draw;
  }
  abstract init(): void
}
