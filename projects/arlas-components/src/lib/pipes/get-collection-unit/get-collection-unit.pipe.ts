import { Pipe, PipeTransform } from '@angular/core';
import { CollectionService } from '../../services/collection.service';

@Pipe({
  name: 'getCollectionUnit'
})
export class GetCollectionUnitPipe implements PipeTransform {

  public constructor(private collectionService: CollectionService) {
  }
  public transform(value: string): unknown {
    if(!value) {
      return  '';
    }
    return this.collectionService.getUnit(value);
  }

}
