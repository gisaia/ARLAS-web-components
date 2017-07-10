import { Observable } from "rxjs/Observable";
import { CompleterBaseData } from "./completer-base-data";
import { CompleterItem } from "../components/completer-item";
export declare class LocalData extends CompleterBaseData {
    private _data;
    private savedTerm;
    constructor();
    data(data: any[] | Observable<any[]>): this;
    search(term: string): void;
    convertToItem(data: any): CompleterItem | null;
}
