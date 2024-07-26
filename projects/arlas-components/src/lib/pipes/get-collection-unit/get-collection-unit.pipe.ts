import { Pipe, PipeTransform } from '@angular/core';
import { CollectionService } from "../../services/collection.service";

@Pipe({
  name: 'getCollectionUnit'
})
export class GetCollectionUnitPipe implements PipeTransform {

  constructor(private collectionService: CollectionService) {
  }
  transform(value: string): unknown {
    if(!value) {
      return  '';
    }
    return this.collectionService.getUnit(value);
  }

}
