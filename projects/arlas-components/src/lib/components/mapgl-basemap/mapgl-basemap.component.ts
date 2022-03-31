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

  }

  public onChangeBasemapStyle(style: BasemapStyle){
    this.basemapChanged.next(style);
  }
}
