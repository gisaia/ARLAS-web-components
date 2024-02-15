import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Subject} from 'rxjs/internal/Subject';
import {MapSource} from '../mapgl/model/mapSource';
import {MapglService} from '../../services/mapgl.service';
import {HttpClient} from '@angular/common/http';
import {MapboxBasemapService} from '../mapgl/basemaps/basemap.service';
import {BasemapStyle} from '../mapgl/basemaps/basemap.config';
import {ArlasBasemaps} from '../mapgl/basemaps/basemaps';
import * as maplibregl from 'maplibre-gl';
import {Layer} from '../mapgl/model/mapLayers';

@Component({
  selector: 'arlas-mapgl-basemap',
  templateUrl: './mapgl-basemap.component.html',
  styleUrls: ['./mapgl-basemap.component.css']
})
export class MapglBasemapComponent implements OnInit {
  private LOCAL_STORAGE_BASEMAPS = 'arlas_last_base_map';

  @Input() public map: maplibregl.Map;
  @Input() public mapSources: Array<MapSource>;

  @Output() public basemapChanged = new EventEmitter<void>();
  @Output() public blur = new Subject<void>();

  public showList = false;
  public basemaps: ArlasBasemaps;


  public constructor(
    private mapglService: MapglService,
    private basemapService: MapboxBasemapService,
    private http: HttpClient) { }

  public ngOnInit(): void {
    this.initBasemaps();
  }

  private initBasemaps() {
    this.basemaps = this.basemapService.basemaps;
    if (!!this.basemaps) {
      const styles = this.basemaps.styles();
      if (!!styles) {
        this.showList = styles.length > 0;
        styles.filter(bm => !bm.image).forEach(bm => {
          if (bm.type !== 'protomap') {
            const splitUrl = bm.styleFile.toString().split('/style.json?key=');
            if (splitUrl.length === 2) {
              bm.image = `${splitUrl[0]}/0/0/0.png?key=${splitUrl[1]}`;
            }
          }
        });
      }
    }
  }

  public onChangeBasemap(newBasemap: BasemapStyle) {
    const selectedBasemap = this.basemaps.getSelected();
    if (selectedBasemap.type === 'protomap') {
      this.basemapService.removeProtomapBasemap(this.map);
    }
    this.setBaseMapStyle(newBasemap);
  }

  public setBaseMapStyle(newBasemap: BasemapStyle) {
    if (this.map) {
      this.setStyle(this.basemaps.getSelected().styleFile as maplibregl.StyleSpecification, newBasemap);
    }
  }

  public setStyle(s: maplibregl.StyleSpecification, newBasemap: BasemapStyle) {
    const selectedBasemapLayersSet = new Set<string>();
    const layers: Array<maplibregl.LayerSpecification> = (<maplibregl.Map>this.map).getStyle().layers;
    const sources = (<maplibregl.Map>this.map).getStyle().sources;
    if (s.layers) {
      s.layers.forEach(l => selectedBasemapLayersSet.add(l.id));
    }
    const layersToSave = new Array<maplibregl.LayerSpecification>();
    const sourcesToSave = new Array<MapSource>();
    layers.filter((l: maplibregl.LayerSpecification) => !selectedBasemapLayersSet.has(l.id) && !!(<Layer>l).source).forEach(l => {
      layersToSave.push(l);
      if (sourcesToSave.filter(ms => ms.id === (<Layer>l).source.toString()).length === 0) {
        sourcesToSave.push({ id: (<Layer>l).source.toString(), source: sources[(<Layer>l).source.toString()] });
      }
    });
    const sourcesToSaveSet = new Set<string>();
    sourcesToSave.forEach(mapSource => sourcesToSaveSet.add(mapSource.id));
    if (this.mapSources) {
      this.mapSources.forEach(mapSource => {
        if (!sourcesToSaveSet.has(mapSource.id)) {
          sourcesToSave.push(mapSource);
        }
      });
    }
    const initStyle = this.basemapService.getInitStyle(newBasemap);
    this.map.setStyle(initStyle).once('styledata', () => {
      this.mapglService.addSourcesToMap(sourcesToSave, this.map);
      layersToSave.forEach(l => this.map.addLayer(l));
      localStorage.setItem(this.LOCAL_STORAGE_BASEMAPS, JSON.stringify(newBasemap));
      this.basemaps.setSelected(newBasemap);
      if (newBasemap.type === 'protomap') {
        this.basemapService.addProtomapBasemap(this.map);
        this.basemapService.notifyProtomapAddition();
      }
      this.basemapChanged.emit();
    });
  }
}
