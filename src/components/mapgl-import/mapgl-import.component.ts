import { Component, Input, ViewChild, ElementRef, Output } from '@angular/core';
import * as shp from 'shpjs/dist/shp';
import * as extent from 'turf-extent';
import * as helpers from '@turf/helpers';
import * as centroid from '@turf/centroid';
import { MatDialog, MatDialogRef } from '@angular/material';
import { MapglComponent } from '../mapgl/mapgl.component';
import { Subject } from 'rxjs';

@Component({
  templateUrl: './mapgl-import-dialog.component.html',
  selector: 'arlas-mapgl-import-dialog',
  styleUrls: ['./mapgl-import-dialog.component.css']
})

export class MapglImportDialogComponent {
  @Output() public imported = new Subject<any>();
  @Output() public error = new Subject<any>();

  @ViewChild('fileInput') public fileInput: ElementRef;

  public currentFile: File;
  public mapComponent: MapglComponent;
  public fitResult = false;
  public errorNbFeatures = false;
  public isRunning = false;

  private SOURCE_NAME_POLYGON_IMPORTED = 'polygon_imported';

  constructor(private dialogRef: MatDialogRef<MapglImportDialogComponent>) { }

  public onChange(files: FileList) {
    this.currentFile = files.item(0);
    this.errorNbFeatures = false;
  }

  public onCancel() {
    this.dialogRef.close();
  }

  public import() {
    this.isRunning = true;
    const reader: FileReader = new FileReader();
    reader.onload = (() => {
      return (evt) => {
        // Clean layer and source of imported polygons
        const importLayer = this.mapComponent.map.getLayer(this.SOURCE_NAME_POLYGON_IMPORTED);
        const importSource = this.mapComponent.map.getSource(this.SOURCE_NAME_POLYGON_IMPORTED);
        if (importLayer !== undefined) {
          this.mapComponent.map.removeLayer(this.SOURCE_NAME_POLYGON_IMPORTED);
        }
        if (importSource !== undefined) {
          this.mapComponent.map.removeSource(this.SOURCE_NAME_POLYGON_IMPORTED);
        }

        shp(evt.target.result).then(geojson => {
          if (geojson.features.length >= 100000) {
            this.error.next('Too much features');
            this.errorNbFeatures = true;
            this.isRunning = false;
            this.fileInput.nativeElement.value = '';
            this.currentFile = null;
            return;
          } else {
            const centroides = new Array<any>();
            const importedGeojson = {
              type: 'FeatureCollection',
              features: []
            };

            let index = 0;
            geojson.features.filter(feature => feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')
              .forEach((feature) => {
                if (feature.geometry.type === 'MultiPolygon') {
                  // Create a new Polygon feature for each polygon in the MultiPolygon
                  // All properties of the MultiPolygon are copied in each feature created
                  feature.geometry.coordinates.forEach(geom => {
                    const newFeature = {
                      type: 'Feature',
                      geometry: {
                        bbox: feature.geometry.bbox,
                        coordinates: geom,
                        type: 'Polygon'
                      },
                      properties: feature.properties
                    };
                    newFeature.properties.arlas_id = ++index;
                    const cent = this.calcCentroid(newFeature);
                    centroides.push(cent);
                    importedGeojson.features.push(newFeature);
                  });
                } else {
                  feature.properties.arlas_id = ++index;
                  const cent = this.calcCentroid(feature);
                  centroides.push(cent);
                  importedGeojson.features.push(feature);
                }
              });

            this.mapComponent.map.addSource(this.SOURCE_NAME_POLYGON_IMPORTED, {
              'type': 'geojson',
              'data': importedGeojson
            });

            this.mapComponent.map.addLayer({
              'id': this.SOURCE_NAME_POLYGON_IMPORTED,
              'type': 'fill',
              'paint': {
                'fill-color': 'rgba(153, 32, 228, 1)',
                'fill-opacity': 0.4,
                'fill-outline-color': 'rgba(0, 0, 0, 1)'
              },
              'source': this.SOURCE_NAME_POLYGON_IMPORTED
            }, 'polygon_label');

            this.mapComponent.map.getSource('polygon_label').setData({
              type: 'FeatureCollection',
              features: centroides
            });

            if (this.fitResult) {
              this.mapComponent.map.fitBounds(extent(importedGeojson));
            }
            this.dialogRef.close();
            this.imported.next(importedGeojson);
            this.isRunning = false;
          }
        });
      };
    })();

    reader.readAsArrayBuffer(this.currentFile);
  }

  public calcCentroid(feature) {
    const poly = helpers.polygon(feature.geometry.coordinates);
    const cent = centroid.default(poly);
    cent.properties.arlas_id = feature.properties.arlas_id;
    return cent;
  }
}


@Component({
  templateUrl: './mapgl-import.component.html',
  selector: 'arlas-mapgl-import',
  styleUrls: ['./mapgl-import.component.css']
})

export class MapglImportComponent {
  @Input() public icon = 'get_app';
  @Input() public mapComponent: MapglComponent;
  @Output() public imported = new Subject<any>();
  @Output() public error = new Subject<any>();

  public dialogRef: MatDialogRef<MapglImportDialogComponent>;
  constructor(
    public dialog: MatDialog
  ) { }

  public openDialog() {
    this.dialogRef = this.dialog.open(MapglImportDialogComponent, { data: null });
    this.dialogRef.componentInstance.mapComponent = this.mapComponent;

    this.dialogRef.componentInstance.imported.subscribe(imp => {
      this.imported.next(imp);
    });
    this.dialogRef.componentInstance.error.subscribe(error => {
      this.error.next(error);
    });

  }

}
