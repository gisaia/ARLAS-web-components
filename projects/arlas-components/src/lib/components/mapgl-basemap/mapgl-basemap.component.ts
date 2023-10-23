import { Component, Input, OnInit, Output, OnChanges, SimpleChanges, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import mapboxgl, { AnyLayer } from 'mapbox-gl';
import { MapSource } from '../mapgl/model/mapSource';
import { MapglService } from '../../services/mapgl.service';
import { HttpClient } from '@angular/common/http';
import { MapboxBasemapService } from '../mapgl/basemaps/basemap.service';
import { BasemapStyle, OfflineBasemapTheme } from '../mapgl/basemaps/basemap.config';
import { OfflineBasemap } from '../mapgl/basemaps/offline-basemap';
import { OnlineBasemap } from '../mapgl/basemaps/online-basemap';

@Component({
  selector: 'arlas-mapgl-basemap',
  templateUrl: './mapgl-basemap.component.html',
  styleUrls: ['./mapgl-basemap.component.css']
})
export class MapglBasemapComponent implements OnInit {
  private LOCAL_STORAGE_BASEMAPS = 'arlas_last_base_map';

  @Input() public map: mapboxgl.Map;
  @Input() public mapSources: Array<MapSource>;

  @Output() public basemapChanged = new EventEmitter<void>();
  @Output() public blur = new Subject<void>();

  public showList = false;
  public isOnline = true;
  public onlineBasemaps: OnlineBasemap;
  public offlineBasemaps: OfflineBasemap;

  public constructor(
    private mapglService: MapglService,
    private basemapService: MapboxBasemapService,
    private http: HttpClient) { }

  public ngOnInit(): void {
    this.isOnline = this.basemapService.isOnline();
    if (this.isOnline) {
      this.initOnlineBasemaps();
    } else {
      this.initOfflineBasemaps();
    }
  }

  private initOnlineBasemaps() {
    this.onlineBasemaps = this.basemapService.onlineBasemaps;
    const styles = this.onlineBasemaps.styles();
    if (!!this.onlineBasemaps && !!styles) {
      this.showList = styles.length > 1;
      styles.filter(bm => !bm.image).forEach(bm => {
        const splitUrl = bm.styleFile.toString().split('/style.json?key=');
        if (splitUrl.length === 2) {
          bm.image = `${splitUrl[0]}/0/0/0.png?key=${splitUrl[1]}`;
        }
      });
    }
  }

  private initOfflineBasemaps() {
    this.offlineBasemaps = this.basemapService.offlineBasemaps;
    if (!!this.offlineBasemaps && !!this.offlineBasemaps.themes()) {
      this.showList = this.offlineBasemaps.themes().length > 1;
    }
  }

  public onChangeOfflineBasemap(selectedTheme: OfflineBasemapTheme) {
    this.basemapService.changeOfflineBasemap(this.map, selectedTheme);
  }

  public onChangeOnlineBasemap(selectedStyle: BasemapStyle) {
    this.setBaseMapStyle(selectedStyle.styleFile);
    localStorage.setItem(this.LOCAL_STORAGE_BASEMAPS, JSON.stringify(selectedStyle));
    this.onlineBasemaps.setSelected(selectedStyle);
  }

  public setBaseMapStyle(style: string | mapboxgl.Style) {
    if (this.map) {
      const selectedStyle = this.onlineBasemaps.getSelected();
      if (typeof selectedStyle.styleFile === 'string') {
        this.http.get(selectedStyle.styleFile).subscribe((s: any) => {
          this.setStyle(s, style);
        });
      } else {
        this.setStyle(selectedStyle.styleFile, style);
      }
    }
  }

  public setStyle(s: mapboxgl.Style, style: string | mapboxgl.Style) {
    const selectedBasemapLayersSet = new Set<string>();
    const layers: Array<mapboxgl.Layer> = (<mapboxgl.Map>this.map).getStyle().layers;
    const sources = (<mapboxgl.Map>this.map).getStyle().sources;
    if (s.layers) {
      s.layers.forEach(l => selectedBasemapLayersSet.add(l.id));
    }
    const layersToSave = new Array<mapboxgl.Layer>();
    const sourcesToSave = new Array<MapSource>();
    layers.filter((l: mapboxgl.Layer) => !selectedBasemapLayersSet.has(l.id)).forEach(l => {
      layersToSave.push(l);
      if (sourcesToSave.filter(ms => ms.id === l.source.toString()).length === 0) {
        sourcesToSave.push({ id: l.source.toString(), source: sources[l.source.toString()] });
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
    this.map.setStyle(style).once('styledata', () => {
      this.mapglService.addSourcesToMap(sourcesToSave, this.map);
      layersToSave.forEach(l => this.map.addLayer(l as AnyLayer));
      this.basemapChanged.emit();
    });
  }
}
