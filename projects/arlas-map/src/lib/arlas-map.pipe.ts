import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'getCollection' })
export class GetCollectionPipe implements PipeTransform {
  public transform(value: string, layersMap?: Map<string, any>): string {
    let collection: string;
    if (!!layersMap && !!layersMap.get(value).metadata) {
      if (!!layersMap.get(value).metadata.collection) {
        collection = layersMap.get(value).metadata.collection;
      }
    }
    return collection;
  }
}