var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { CompleterBaseData } from "./completer-base-data";
var LocalData = (function (_super) {
    __extends(LocalData, _super);
    function LocalData() {
        return _super.call(this) || this;
    }
    LocalData.prototype.data = function (data) {
        var _this = this;
        if (data instanceof Observable) {
            data.subscribe(function (res) {
                _this._data = res;
                if (_this.savedTerm) {
                    _this.search(_this.savedTerm);
                }
            });
        }
        else {
            this._data = data;
        }
        return this;
    };
    LocalData.prototype.search = function (term) {
        if (!this._data) {
            this.savedTerm = term;
        }
        else {
            this.savedTerm = null;
            var matches = this.extractMatches(this._data, term);
            this.next(this.processResults(matches));
        }
    };
    LocalData.prototype.convertToItem = function (data) {
        return _super.prototype.convertToItem.call(this, data);
    };
    return LocalData;
}(CompleterBaseData));
export { LocalData };
LocalData.decorators = [
    { type: Injectable },
];
/** @nocollapse */
LocalData.ctorParameters = function () { return []; };
//# sourceMappingURL=local-data.js.map