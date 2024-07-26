import { Pipe, PipeTransform } from '@angular/core';
import { CollectionService } from "../../services/collection.service";
import { Observable, of } from "rxjs";

@Pipe({
  name: 'getCollectionDisplayName'
})
export class GetCollectionDisplayNamePipe implements PipeTransform {

  constructor(private collectionService: CollectionService) {
  }

  transform(value: string, ...args: unknown[]): string {
    if(!value) {
      return  '';
    }
    return  this.collectionService.getDisplayName(value);
  }

}
