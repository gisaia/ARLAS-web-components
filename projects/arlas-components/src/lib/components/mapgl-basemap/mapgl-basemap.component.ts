import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import mapboxgl, { AnyLayer } from 'mapbox-gl';
import { MapSource } from '../mapgl/model/mapSource';
import { MapglService } from '../../services/mapgl.service';
import { MapboxBasemapService } from '../mapgl/basemaps/basemap.service';
import { BasemapStyle } from '../mapgl/basemaps/basemap.config';
import { ArlasBasemaps } from '../mapgl/basemaps/basemaps';

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
  public basemaps: ArlasBasemaps;


  public constructor(private mapglService: MapglService, private basemapService: MapboxBasemapService) { }

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
          if (bm.type !== 'protomap' && !!bm.url) {
            const splitUrl = bm.url.split('/style.json?key=');
            if (splitUrl.length === 2) {
              bm.image = `${splitUrl[0]}/0/0/0.png?key=${splitUrl[1]}`;
            }
          }
        });
      }
    }
  }

  /** Removes the old basemap and set the new one that is given as a parameter
   * @param newBasemap: Basemap selected by the user
   */
  public onChangeBasemap(newBasemap: BasemapStyle) {
    const selectedBasemap = this.basemaps.getSelected();
    if (selectedBasemap.type === 'protomap') {
      this.basemapService.removeProtomapBasemap(this.map);
    }
    this.setBaseMapStyle(newBasemap);
  }

  public setBaseMapStyle(newBasemap: BasemapStyle) {
    if (this.map) {
      this.setStyle(this.basemaps.getSelected().styleFile as mapboxgl.Style, newBasemap);
    }
  }

  /**  Set mapbox new style.
   * !!NOTE: mapbox setStyle removes all added layers from the map; thus the following description :
   * This method saves all the currently added layers to the map, applies the 'map.setStyle' and adds all the saved layers afterwards.
  */
  public setStyle(s: mapboxgl.Style, newBasemap: BasemapStyle) {
    const selectedBasemapLayersSet = new Set<string>();
    const layers: Array<mapboxgl.Layer> = (<mapboxgl.Map>this.map).getStyle().layers;
    const sources = (<mapboxgl.Map>this.map).getStyle().sources;
    if (s.layers) {
      s.layers.forEach(l => selectedBasemapLayersSet.add(l.id));
    }
    const layersToSave = new Array<mapboxgl.Layer>();
    const sourcesToSave = new Array<MapSource>();
    layers.filter((l: mapboxgl.Layer) => !selectedBasemapLayersSet.has(l.id) && !!l.source).forEach(l => {
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
    const initStyle = this.basemapService.getInitStyle(newBasemap);
    this.map.setStyle(initStyle).once('styledata', () => {
      setTimeout(() => {
        /** the timeout fixes a mapboxgl bug related to layer placement*/
        this.mapglService.addSourcesToMap(sourcesToSave, this.map);
        layersToSave.forEach(l => {
          if (!this.map.getLayer(l.id)) {
            this.map.addLayer(l as AnyLayer);
          }
        });
        localStorage.setItem(this.LOCAL_STORAGE_BASEMAPS, JSON.stringify(newBasemap));
        this.basemaps.setSelected(newBasemap);
        if (newBasemap.type === 'protomap') {
          this.basemapService.addProtomapBasemap(this.map);
          this.basemapService.notifyProtomapAddition();
        }
        this.basemapChanged.emit();
      }, 0);
    });
  }
}
