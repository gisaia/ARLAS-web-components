import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'arlas-powerbars-demo',
  templateUrl: './powerbars-demo.component.html',
  styleUrls: ['./powerbars-demo.component.css']
})
export class PowerbarsDemoComponent implements OnInit {

  public constructors = new Array<[string, number]>();
  public constructorsTitle = 'Constructors';

  public countries = new Array<[string, number]>();
  public countriesTitle = 'Countries';

  public airlines = new Array<[string, number]>();
  public airlinesTitle = 'Airlines';

  constructor() { }

  public ngOnInit() {
    this.constructors.push(['Airbus', 1000]);
    this.constructors.push(['Boeing', 800]);
    this.constructors.push(['Bombardier', 600]);
    this.constructors.push(['Pilatus', 100]);

    this.airlines.push(['Air France', 2000]);
    this.airlines.push(['Iberia', 1500]);
    this.airlines.push(['KWS', 1000]);
    this.airlines.push(['Emirates', 500]);
    this.airlines.push(['Rynair', 200]);
    this.airlines.push(['EasyJet', 5]);

    this.countries.push(['France', 2000]);
    this.countries.push(['Germany', 1800]);
    this.countries.push(['Switzerland', 1700]);
    this.countries.push(['England', 1000]);
    this.countries.push(['Italy', 200]);
    this.countries.push(['Spain', 180]);
    this.countries.push(['Portugal', 100]);
  }

}
