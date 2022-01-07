import { Component, ViewChild, OnInit } from '@angular/core';
import { WmtsLayerManagerComponent } from '../../../projects/arlas-components/src/public-api';

@Component({
  selector: 'arlas-wmts-layer-manager-demo',
  templateUrl: './wmts-layer-manager-demo.component.html',
  styleUrls: ['./wmts-layer-manager-demo.component.css']
})
export class WmtsLayerManagerDemoComponent implements OnInit {
    @ViewChild('wmtsLayerManager', { static: false }) public wmtsLayerMangerComponent: WmtsLayerManagerComponent;

    public getCapaUrl = '/assets/getCap_1.xml';
    public metadata = new Map<string, string>();
    constructor() { }

    public ngOnInit(

    ) {
      this.metadata.set('Id', '65b4c9b2-9acc-4cb0-998d-a375df0830d2');
      this.metadata.set('Collection', 'Sentinel S5P');
      this.metadata.set('Date', new Date().toISOString());

    }
}
