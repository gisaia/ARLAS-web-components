import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Coordinate, PointFormGroup } from '../../../tools/coordinates.tools';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'arlas-coordinates',
  templateUrl: './coordinates.component.html',
  styleUrls: ['./coordinates.component.scss']
})
export class CoordinatesComponent implements OnInit {
  @Input() public currentLat: string;
  @Input() public currentLng: string;

  public placeHolder = '1.1 or 1°6\'3"';

  @Output() public moveToCoordinates$: EventEmitter<[number, number]> = new EventEmitter();
  public coordinatesForm: PointFormGroup;
  public editionMode = false;

  public ngOnInit(): void {
    this.coordinatesForm = new PointFormGroup(this.currentLat, this.currentLng);
  }

  public switchToEditionMode() {
    this.editionMode = true;
    this.coordinatesForm.latitude.setValue(this.currentLat);
    this.coordinatesForm.longitude.setValue(this.currentLng);
  }

  public getErrorMessage(formControl: FormControl | FormGroup) {
    if (formControl.hasError('required')) {
      return 'You must enter a coordinate';
    }
    return formControl.hasError('pattern') ? this.placeHolder : '';
  }

  public moveToCoordinates() {
    const lat = Coordinate.parse(this.coordinatesForm.latitude.value);
    const lng = Coordinate.parse(this.coordinatesForm.longitude.value);
    this.moveToCoordinates$.emit([lng, lat]);
    this.editionMode = false;
    this.currentLat = String(lat);
    this.currentLng = String(lng);
  }

}
