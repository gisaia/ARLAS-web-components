import { Component, OnInit, SimpleChange } from '@angular/core';
import { DetailedDataRetrieverImp} from './utils/detailed-data-retriever';

@Component({
  selector: 'arlas-results-demo',
  templateUrl: './results-demo.component.html',
  styleUrls: ['./results-demo.component.css']
})
export class ResultsDemoComponent implements OnInit {

  public data: Array<Map<string, string | number | Date>>;
  public fieldsList: Array<{columnName: string, fieldName: string, dataType: string}>;
  public detailedDataRetriever: DetailedDataRetrieverImp = new DetailedDataRetrieverImp();
  public count = 0;

  constructor() {}

  public ngOnInit() {
    this.fieldsList = new Array<{columnName: string, fieldName: string, dataType: string}>();
    this.fieldsList.push({columnName: 'Source', fieldName: 'source', dataType: ''});
    this.fieldsList.push({columnName: 'Acquired', fieldName: 'acquired', dataType: ''});
    this.fieldsList.push({columnName: 'Cloud', fieldName: 'cloud', dataType: '%'});
    this.fieldsList.push({columnName: 'Incidence', fieldName: 'incidence', dataType: '°'});
    this.fieldsList.push({columnName: 'Id', fieldName: 'id', dataType: ''});

    this.data = new Array<Map<string, string | number | Date>>();
    for ( let i = 0; i < 50; i++) {
      const map = new Map<string, string | number | Date>();
      map.set('source', 'SPOT' + (i + 1));
      map.set('acquired', '2017-0' + (i + 1) + '-' + (i + 3));
      map.set('cloud', (i + 1) + '.0');
      map.set('incidence', (i + 10) );
      map.set('id', (i + 10) );
      this.data.push(map);
    }
  }

  public addMoreData() {
    setTimeout(() => {
      if ( this.count < 2 ) {
        for ( let i = 50; i < 70; i++) {
          const map = new Map<string, string | number | Date>();
          map.set('source', 'SPOT' + (i + 1));
          map.set('acquired', '2017-0' + (i + 1) + '-' + (i + 3));
          map.set('cloud', (i + 1) + '.0');
          map.set('incidence', (i + 10) );
          map.set('id', (i + 10) );
          this.data.push(map);
        }
        this.count++;
      }
    }, 3000);
  }

  public updateData() {
    this.data = new Array<Map<string, string | number | Date>>();
    const map = new Map<string, string | number | Date>();
    map.set('source', 'SPOT' + (5 + 1));
    map.set('acquired', '2017-555555550' + (5 + 1) + '-' + (5 + 3));
    map.set('cloud', (5 + 1) + '.0');
    map.set('incidence', (5 + 10) );
    map.set('id', (5 + 10) );
    this.data.push(map);
  }

  public addData() {
    const map = new Map<string, string | number | Date>();
    map.set('source', 'SPOT' + (5 + 1));
    map.set('acquired', '2017-0' + (5 + 1) + '-' + (5 + 3));
    map.set('cloud', (5 + 1) + '.0');
    map.set('incidence', (5 + 10) );
    map.set('id', (5 + 10) );
    this.data.push(map);
  }

  public newColumns() {
    this.fieldsList = new Array<{columnName: string, fieldName: string, dataType: string}>();
    this.fieldsList.push({columnName: 'Src', fieldName: 'source', dataType: ''});
    this.fieldsList.push({columnName: 'Acquiered', fieldName: 'acquired', dataType: ''});
    this.fieldsList.push({columnName: 'Cloud', fieldName: 'cloud', dataType: '%'});
    this.fieldsList.push({columnName: 'Angle', fieldName: 'incidence', dataType: '°'});
    this.fieldsList.push({columnName: 'Test1', fieldName: 'test_1', dataType: '°'});
    this.fieldsList.push({columnName: 'Test2', fieldName: 'test_2', dataType: '°C'});
    this.fieldsList.push({columnName: 'Test3', fieldName: 'test_3', dataType: '°C'});
    this.fieldsList.push({columnName: 'Id', fieldName: 'id', dataType: ''});

    this.data = new Array<Map<string, string | number | Date>>();
    for ( let i = 0; i < 5; i++) {
      const map = new Map<string, string | number | Date>();
      map.set('source', 'SPOT' + (i + 1));
      map.set('acquired', '2017-0' + (i + 1) + '-' + (i + 3));
      map.set('cloud', (i + 1) + '.0');
      map.set('test_1', (i + 10) );
      map.set('test_2', (i * 2 + 10) );
      map.set('test_3', (i * 2 + 10) );
      map.set('incidence', (i + 10) );
      map.set('id', (i + 10) );
      this.data.push(map);
    }
  }

  public setFilters(fieldsToFilter: Map<string, string | number | Date>) {
    this.data.pop();
  }

}
