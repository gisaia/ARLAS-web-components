import { Component, Input } from '@angular/core';
import * as shp from 'shpjs/dist/shp';
import * as extent from 'turf-extent';
import { MatDialog, MatDialogRef } from '@angular/material';
import { MapglComponent } from '../mapgl/mapgl.component';

@Component({
  templateUrl: './mapgl-import-dialog.component.html',
  selector: 'arlas-mapgl-import-dialog',
  styleUrls: ['./mapgl-import-dialog.component.css']
})

export class MapglImportDialogComponent {
  public currentFile: File;
  public mapComponent: MapglComponent;

  public fitResult = false;
  public closeAfter = false;

  constructor(private dialogRef: MatDialogRef<MapglImportDialogComponent>) { }
  public onChange(files: FileList) {
    this.currentFile = files.item(0);
  }

  public onCancel() {
    this.dialogRef.close();
  }

  public import() {
    const reader: FileReader = new FileReader();
    reader.onload = (() => {
      return (evt) => {
        shp(evt.target.result).then(geojson => {
          const name = this.currentFile.name.split('.')[0];
          this.mapComponent.map.addSource(name, {
            'type': 'geojson',
            'data': geojson
          });
          this.mapComponent.map.addLayer({
            'id': name,
            'type': 'line',
            'source': name
          }, 'polygon_label');
          if (this.fitResult) {
            this.mapComponent.map.fitBounds(extent(geojson));
          }
          if (this.closeAfter) {
            this.dialogRef.close();
          }
        });
      };
    })();

    reader.readAsArrayBuffer(this.currentFile);
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

  public dialogRef: MatDialogRef<MapglImportDialogComponent>;
  constructor(
    public dialog: MatDialog
  ) { }

  public openDialog() {
    this.dialogRef = this.dialog.open(MapglImportDialogComponent, { data: null });
    this.dialogRef.componentInstance.mapComponent = this.mapComponent;
  }
}
