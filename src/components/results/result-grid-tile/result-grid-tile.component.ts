import { Component, OnInit, Input } from '@angular/core';
import { GridTile } from '../model/gridTile';

@Component({
  selector: 'arlas-result-grid-tile',
  templateUrl: './result-grid-tile.component.html',
  styleUrls: ['./result-grid-tile.component.css']
})
export class ResultGridTileComponent implements OnInit {

  @Input() public gridTile: GridTile;

  constructor() { }

  public ngOnInit() {
  }

}
