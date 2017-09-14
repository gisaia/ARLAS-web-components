import { Evented } from "leaflet";
declare namespace leaflet{
   export class Pattern extends Evented {

}
    export class StripePattern extends  Pattern{

    }
    export function stripePattern(options:any) : StripePattern

}

