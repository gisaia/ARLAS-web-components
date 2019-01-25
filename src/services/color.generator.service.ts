import { Injectable } from '@angular/core';
import { ColorGeneratorLoader } from '../components/componentsUtils';

@Injectable()
export class ArlasColorService {

  constructor(public colorGenerator: ColorGeneratorLoader) {}

  public getColor(key: string, keysToColors: Array<[string, string]>, colorsSaturationWeight: number): string {
    return this.colorGenerator.getColor(key, keysToColors, colorsSaturationWeight);
  }

  public getTextColor(color): string {
    return this.colorGenerator.getTextColor(color);
  }
}


