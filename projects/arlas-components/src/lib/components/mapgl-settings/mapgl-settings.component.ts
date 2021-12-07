import { ChangeDetectorRef, Component, Input, OnInit, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { BasemapStyle, BasemapStylesGroup } from '../../components/mapgl/model/mapLayers';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

export interface GeometrySelectModel {
  path: string;
  selected?: boolean;
}

export interface OperationSelectModel {
  operation: string;
  selected?: boolean;
}
export interface GeoQuery {
  operation: string;
  geometry_path: string;
}

export interface MapSettingsService {
  getFilterGeometries(): Array<GeometrySelectModel>;
  getOperations(): Array<OperationSelectModel>;
}

@Component({
  selector: 'arlas-mapgl-settings-dialog',
  templateUrl: './mapgl-settings-dialog.component.html',
  styleUrls: ['./mapgl-settings-dialog.component.css']
})
export class MapglSettingsDialogComponent implements OnInit {
  /**
   * @Angular
   * List of styles groups to display.
   * For cluster mode, a StyleGroup named "cluster" is needed ("StyleGroup.id":"cluster").
   * For feature mode, a StyleGroup should be created for each geometry ("StyleGroup.id": "{geometry_path}")
   */

  /**
   * @Angular
   * Contains :
   * - List of basemaps to display.
   * - The selected basemap
   */
  @Input()
  public basemapStylesGroup: BasemapStylesGroup;

  /**
   * @Angular
   * Emits the geo-query to apply. A geo-query is defined by
   * - the operation ("within", "intersects", "notwithin", "notintersects")
   * - the geometry field to query
   */
  @Output()
  public geoQueryEmitter: Subject<GeoQuery> = new Subject<GeoQuery>();
  /**
   * @Angular
   * Emits the chosen basemap style
   */
  @Output()
  public baseMapStyleEmitter: Subject<BasemapStyle> = new Subject<BasemapStyle>();

  /** Constants */
  public GEO_QUERIES_DESCRIPTION = 'Draw a bbox or a polygon that';
  public GEO_QUERIES_GEOMETRY_DESCRIPTION = 'the following geometry';
  public CONSTANTS = {
    WITHIN: 'within',
    NOTWITHIN: 'notwithin',
    INTERSECTS: 'intersects',
    NOTINTERSECTS: 'notintersects'
  };

  /** Rendered geometries form controls */
  public clusterGeoControl: FormControl = new FormControl('cluster_displayed_geo', Validators.required);
  public featuresGeoControl: FormControl = new FormControl('features_displayed_geo', Validators.required);
  public topologyGeoControl: FormControl = new FormControl('topology_displayed_geo', Validators.required);

  /** Geo-filter geometry form control */
  public geoFilterControl: FormControl = new FormControl('geo_filter_geometry', Validators.required);

  /** Variables binded with HTML, set from the parent component of this dialog*/
  public filterGeometries: Array<GeometrySelectModel>;
  public operations: Array<OperationSelectModel>;
  /** Variables binded with HTML, set inside this dialog */

  public selectedOperation: string;
  public selectedGeoFilterGeometry: GeometrySelectModel;


  public currentTabIndex = 0;

  constructor(private dialogRef: MatDialogRef<MapglSettingsComponent>,
    private cdr: ChangeDetectorRef,
    private iconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer) { }

  public ngOnInit() {
    /** Populate the filters geometries to query */
    if (this.filterGeometries) {
      this.geoFilterControl.setValue(this.filterGeometries);
      this.selectedGeoFilterGeometry = this.filterGeometries.filter(g => g.selected)[0];
      if (!this.selectedGeoFilterGeometry) {
        this.logSelectedGeometryError(this.filterGeometries);
      }
    }

    if (this.operations) {
      this.selectedOperation = this.operations.find(o => o.selected).operation;
    }

    // eslint-disable-next-line max-len
    this.iconRegistry.addSvgIconLiteral('basemap', this.domSanitizer.bypassSecurityTrustHtml('<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 32 32" height="32px" id="Layer_1" version="1.1" viewBox="0 0 32 32" width="32px" xml:space="preserve" ><defs id="defs1715" /><sodipodi:namedview pagecolor="#ffffff" bordercolor="#666666" borderopacity="1" objecttolerance="10" gridtolerance="10" guidetolerance="10" id="namedview1713" showgrid="false" /><g id="globe-2" style="fill:#000000"><polygon fill="#515151" points="13.179,6.288 13.179,6.315 13.195,6.295 " id="polygon1707" style="fill:#000000" /><path d="M15.624,1.028c-7.811,0-14.167,6.355-14.167,14.167c0,7.812,6.356,14.167,14.167,14.167 c7.812,0,14.168-6.354,14.168-14.167C29.792,7.383,23.436,1.028,15.624,1.028z M28.567,15.195c0,0.248-0.022,0.49-0.037,0.735 c-0.091-0.23-0.229-0.53-0.262-0.659c-0.048-0.196-0.341-0.879-0.341-0.879s-0.293-0.39-0.488-0.488 c-0.194-0.098-0.341-0.342-0.683-0.536c-0.342-0.196-0.487-0.293-0.779-0.293c-0.294,0-0.585-0.391-0.928-0.586 c-0.342-0.194-0.39-0.097-0.39-0.097s0.39,0.585,0.39,0.731c0,0.146,0.438,0.39,0.879,0.292c0,0,0.292,0.537,0.438,0.683 c0.146,0.146-0.049,0.293-0.341,0.488c-0.293,0.194-0.244,0.146-0.392,0.292c-0.146,0.146-0.633,0.392-0.78,0.488 c-0.146,0.097-0.731,0.39-1.023,0.097c-0.143-0.141-0.099-0.438-0.195-0.634c-0.098-0.195-1.122-1.707-1.61-2.389 c-0.085-0.12-0.293-0.49-0.438-0.585c-0.146-0.099,0.342-0.099,0.342-0.099s0-0.342-0.049-0.585 c-0.05-0.244,0.049-0.585,0.049-0.585s-0.488,0.292-0.636,0.39c-0.145,0.098-0.292-0.194-0.486-0.439 c-0.195-0.243-0.391-0.537-0.439-0.781c-0.049-0.243,0.244-0.341,0.244-0.341l0.438-0.243c0,0,0.537-0.097,0.879-0.049 c0.341,0.049,0.877,0.098,0.877,0.098s0.146-0.342-0.049-0.488c-0.194-0.146-0.635-0.39-0.83-0.341 c-0.194,0.048,0.097-0.244,0.34-0.439l-0.54-0.098c0,0-0.491,0.244-0.638,0.293c-0.146,0.048-0.4,0.146-0.596,0.39 c-0.194,0.244,0.078,0.585-0.117,0.683c-0.194,0.098-0.326,0.146-0.473,0.194c-0.146,0.049-0.61,0-0.61,0 c-0.504,0-0.181,0.46-0.05,0.623l-0.39-0.476L18.564,8.88c0,0-0.416-0.292-0.611-0.389c-0.195-0.098-0.796-0.439-0.796-0.439 l0.042,0.439l0.565,0.572l0.05,0.013l0.294,0.39l-0.649,0.049V9.129c-0.612-0.148-0.452-0.3-0.521-0.347 c-0.145-0.097-0.484-0.342-0.484-0.342s-0.574,0.098-0.721,0.147c-0.147,0.049-0.188,0.195-0.479,0.292 c-0.294,0.098-0.426,0.244-0.523,0.39s-0.415,0.585-0.608,0.78c-0.196,0.196-0.558,0.146-0.704,0.146 c-0.147,0-0.851-0.195-0.851-0.195V9.173c0,0,0.095-0.464,0.047-0.61l0.427-0.072l0.713-0.147l0.209-0.147l0.3-0.39 c0,0-0.337-0.244-0.094-0.585c0.117-0.164,0.538-0.195,0.733-0.341c0.194-0.146,0.489-0.244,0.489-0.244s0.342-0.292,0.683-0.634 c0,0,0.244-0.147,0.536-0.245c0,0,0.83,0.732,0.977,0.732s0.683-0.341,0.683-0.341s0.146-0.438,0.098-0.585 c-0.049-0.146-0.293-0.634-0.293-0.634s-0.146,0.244-0.292,0.439s-0.244,0.439-0.244,0.439s-0.683-0.047-0.731-0.193 c-0.05-0.147-0.146-0.388-0.196-0.533c-0.047-0.147-0.438-0.142-0.729-0.044c-0.294,0.098,0.047-0.526,0.047-0.526 s0.294-0.368,0.488-0.368s0.635-0.25,0.828-0.298c0.196-0.049,0.783-0.272,1.025-0.272c0.244,0,0.537,0.105,0.684,0.105 s0.731,0,0.731,0l1.023-0.082c0,0,0.879,0.325,0.585,0.521c0,0,0.343,0.211,0.489,0.357c0.137,0.138,0.491-0.127,0.694-0.24 C26.127,6.525,28.567,10.576,28.567,15.195z M5.296,7.563c0,0.195-0.266,0.242,0,0.732c0.34,0.634,0.048,0.927,0.048,0.927 s-0.83,0.585-0.976,0.683c-0.146,0.098-0.536,0.634-0.293,0.487c0.244-0.146,0.536-0.292,0.293,0.098 c-0.244,0.391-0.683,1.024-0.78,1.269s-0.585,0.829-0.585,1.122c0,0.293-0.195,0.879-0.146,1.123 c0.033,0.17-0.075,0.671-0.16,0.877c0.066-2.742,0.989-5.269,2.513-7.336C5.26,7.55,5.296,7.563,5.296,7.563z M6.863,5.693 c1.193-1.101,2.591-1.979,4.133-2.573c-0.152,0.195-0.336,0.395-0.336,0.395s-0.341-0.001-0.976,0.683 C9.051,4.881,9.197,4.686,9.051,4.88S8.953,5.124,8.611,5.369C8.271,5.612,8.124,5.905,8.124,5.905L7.587,6.1L7.149,5.905 c0,0-0.392,0.147-0.343-0.049C6.82,5.804,6.841,5.75,6.863,5.693z M12.709,6.831l-0.194-0.292L12.709,6.1l0.47,0.188V5.417 l0.449-0.243l0.373,0.536l0.574,0.635l-0.381,0.292l-1.016,0.195V6.315L12.709,6.831z M19.051,11.416 c0.114-0.09,0.487,0.146,0.487,0.146s1.219,0.244,1.414,0.39c0.196,0.147,0.537,0.245,0.635,0.392 c0.098,0.146,0.438,0.585,0.486,0.731c0.05,0.146,0.294,0.684,0.343,0.878c0.049,0.195,0.195,0.683,0.341,0.927 c0.146,0.245,0.976,1.317,1.268,1.805l0.88-0.146c0,0-0.099,0.438-0.196,0.585c-0.097,0.146-0.39,0.536-0.536,0.731 c-0.147,0.195-0.341,0.488-0.634,0.731c-0.292,0.243-0.294,0.487-0.439,0.683c-0.146,0.195-0.342,0.634-0.342,0.634 s0.098,0.976,0.146,1.171s-0.341,0.731-0.341,0.731l-0.44,0.44l-0.588,0.779l0.048,0.731c0,0-0.444,0.343-0.689,0.537 c-0.242,0.194-0.204,0.341-0.399,0.537c-0.194,0.194-0.957,0.536-1.152,0.585s-1.271,0.195-1.271,0.195v-0.438l-0.022-0.488 c0,0-0.148-0.585-0.295-0.78s-0.083-0.489-0.327-0.732c-0.244-0.244-0.334-0.438-0.383-0.586c-0.049-0.146,0.053-0.584,0.053-0.584 s0.197-0.537,0.294-0.732c0.098-0.195,0.001-0.487-0.097-0.683s-0.145-0.684-0.145-0.829c0-0.146-0.392-0.391-0.538-0.537 c-0.146-0.146-0.097-0.342-0.097-0.535c0-0.197-0.146-0.635-0.098-0.977c0.049-0.341-0.438-0.098-0.731,0 c-0.293,0.098-0.487-0.098-0.487-0.391s-0.536-0.048-0.878,0.146c-0.343,0.195-0.732,0.195-1.124,0.342 c-0.389,0.146-0.583-0.146-0.583-0.146s-0.343-0.292-0.585-0.439c-0.245-0.146-0.489-0.438-0.685-0.682 c-0.194-0.245-0.683-0.977-0.73-1.268c-0.049-0.294,0-0.49,0-0.831s0-0.536,0.048-0.78c0.049-0.244,0.195-0.537,0.342-0.781 c0.146-0.244,0.683-0.536,0.828-0.634c0.146-0.097,0.488-0.389,0.488-0.585c0-0.195,0.196-0.292,0.292-0.488 c0.099-0.195,0.44-0.682,0.879-0.487c0,0,0.389-0.048,0.535-0.097s0.536-0.194,0.729-0.292c0.195-0.098,0.681-0.144,0.681-0.144 s0.384,0.153,0.53,0.153s0.622-0.085,0.622-0.085s0.22,0.707,0.22,0.854s0.146,0.292,0.391,0.39 C17.44,11.562,18.563,11.807,19.051,11.416z M24.66,20.977c0,0.146-0.049,0.537-0.098,0.732c-0.051,0.195-0.147,0.537-0.195,0.73 c-0.049,0.196-0.293,0.586-0.438,0.684c-0.146,0.098-0.391,0.391-0.536,0.439c-0.146,0.049-0.245-0.342-0.196-0.537 c0.05-0.195,0.293-0.731,0.293-0.731s0.049-0.292,0.097-0.488c0.05-0.194,0.635-0.438,0.635-0.438l0.391-0.732 C24.611,20.635,24.66,20.832,24.66,20.977z M3.015,18.071c0.063,0.016,0.153,0.062,0.28,0.175c0.184,0.16,0.293,0.242,0.537,0.341 c0.243,0.099,0.341,0.243,0.634,0.39c0.293,0.147,0.196,0.05,0.585,0.488c0.391,0.438,0.342,0.438,0.439,0.683 s0.244,0.487,0.342,0.635c0.098,0.146,0.39,0.243,0.536,0.341s0.39,0.195,0.536,0.195c0.147,0,0.586,0.439,0.83,0.487 c0.244,0.05,0.244,0.538,0.244,0.538l-0.244,0.682l-0.196,0.731l0.196,0.585c0,0-0.294,0.245-0.487,0.245 c-0.18,0-0.241,0.114-0.438,0.06C4.949,22.91,3.6,20.638,3.015,18.071z" fill="#515151" id="path1709" style="fill:#000000" /></g></svg>'));
  }

  /** Emits the geo-query to apply */
  public emitGeoFilter() {
    this.geoQueryEmitter.next({
      operation: this.selectedOperation,
      geometry_path: this.geoFilterControl.value.path
    });
  }

  /** closes the dialog */
  public onClose() {
    this.dialogRef.close();
  }
  /** Emits the selected basemap*/
  public emitBasemapStyle(selectedStyle: BasemapStyle) {
    this.baseMapStyleEmitter.next(selectedStyle);
  }

  /** input function for mat-select */
  public compareGeometries = (o: GeometrySelectModel, s: GeometrySelectModel) => s.path === o.path;

  public changeTab(event): void {
    this.currentTabIndex = event.index;
  }

  /** Logs an error if there are no selected geometry to apply queries*/
  private logSelectedGeometryError(gemetriesSelection: Array<GeometrySelectModel>): void {
    let NO_SELECTED_GEOMETRY = 'No geometry is selected to apply queries. There are ' + gemetriesSelection.length +
      'available geometries : ';
    gemetriesSelection.forEach(cg => NO_SELECTED_GEOMETRY += cg.path + ', ');
    console.error(NO_SELECTED_GEOMETRY);
  }
}

@Component({
  selector: 'arlas-mapgl-settings',
  templateUrl: './mapgl-settings.component.html',
  styleUrls: ['./mapgl-settings.component.css']
})
export class MapglSettingsComponent implements OnInit {

  /**
   * @Angular
   * Contains :
   * - List of basemaps to display.
   * - The selected basemap
   */
  @Input()
  public basemapStylesGroup: BasemapStylesGroup;

  /**
   * @Angular
   * Emits the geo-query to apply. A geo-query is defined by
   * - the operation ("within", "intersects", "notwithin", "notintersects")
   * - the geometry field to query
   */
  @Output()
  public geoQueryEmitter: Subject<GeoQuery> = new Subject<GeoQuery>();

  /**
   * @Angular
   * Emits the chosen basemap style
   */
  @Output()
  public baseMapStyleEmitter: Subject<BasemapStyle> = new Subject<BasemapStyle>();
  public dialogRef: MatDialogRef<MapglSettingsDialogComponent>;

  constructor(public dialog: MatDialog) { }

  public ngOnInit() { }

  public openDialog(mapSettingsService: MapSettingsService) {
    this.dialogRef = this.dialog.open(MapglSettingsDialogComponent, { data: null, panelClass: 'map-settings-dialog' });
    this.dialogRef.componentInstance.basemapStylesGroup = this.basemapStylesGroup;
    this.dialogRef.componentInstance.filterGeometries = mapSettingsService.getFilterGeometries();
    this.dialogRef.componentInstance.operations = mapSettingsService.getOperations();
    this.dialogRef.componentInstance.geoQueryEmitter = this.geoQueryEmitter;
    this.dialogRef.componentInstance.baseMapStyleEmitter = this.baseMapStyleEmitter;
  }
}
