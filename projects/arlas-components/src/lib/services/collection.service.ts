import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export abstract class BaseCollectionService {
  protected  abstract _setUnits();
  public abstract  getDisplayName(collectionName: string): Observable<any>;
  public abstract getUnit(collectionName: string): any;
}


@Injectable({
  providedIn: 'root'
})
export class CollectionService  {

  public constructor(private baseCollectionService: BaseCollectionService) {
  }
  public getDisplayName(collectionName: string){
     return this.baseCollectionService.getDisplayName(collectionName);
   };
  public getUnit(collectionName: string){
     return this.baseCollectionService.getUnit(collectionName);
   };
}



