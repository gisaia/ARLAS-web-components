import { Component, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import { BasemapStyle } from '../mapgl/model/mapLayers';

@Component({
  selector: 'arlas-mapgl-basemap',
  templateUrl: './mapgl-basemap.component.html',
  styleUrls: ['./mapgl-basemap.component.css']
})
export class MapglBasemapComponent implements OnInit {

  @Input() public basemapStyles: BasemapStyle[];
  @Input() public selectedBasemap: BasemapStyle;

  @Output() public basemapChanged = new Subject<BasemapStyle>();
  @Output() public blur = new Subject<void>();

  constructor() { }

  public ngOnInit(): void {
    if (this.basemapStyles) {
      this.basemapStyles.filter(bm => !bm.image).forEach(bm => {
        const splitUrl = bm.styleFile.toString().split('/style.json?key=');
        if (splitUrl.length === 2) {
          bm.image = `${splitUrl[0]}/0/0/0.png?key=${splitUrl[1]}`;
        }
      });
    }
  }

  public onChangeBasemapStyle(style: BasemapStyle){
    this.basemapChanged.next(style);
  }
}
