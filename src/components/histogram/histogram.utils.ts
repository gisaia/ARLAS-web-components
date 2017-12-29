
import * as tinycolor from 'tinycolor2';
import * as d3 from 'd3';


export interface MarginModel {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface HistogramData {
  key: Date|number;
  value: number;
}

export interface SwimlaneData {
  key: string;
  value: Array<{ key: number, value: number }>;
}

export interface SwimlaneParsedData {
  key: string;
  value: Array<{ key: number | Date, value: number }>;
}

export interface SelectedOutputValues {
  startvalue: Date|number;
  endvalue: Date|number;
}

export interface SelectedInputValues {
  startvalue: Date | number;
  endvalue: Date | number;
}

export interface ChartDimensions {
  svg: d3.Selection< d3.BaseType, any, d3.BaseType, any>;
  margin: MarginModel;
  width: number;
  height: number;
}

export interface ChartAxes {
  xDomain: any;
  xDataDomain: any;
  yDomain: d3.ScaleLinear<number, number>;
  xTicksAxis: d3.Axis<any>;
  xLabelsAxis: d3.Axis<any>;
  yTicksAxis: d3.Axis<any>;
  yLabelsAxis: d3.Axis<any>;
  stepWidth: number;
  xAxis: d3.Axis<any>;
}

export interface SwimlaneAxes {
  xDomain: any;
  xDataDomainArray: Array<any>;
  xTicksAxis: d3.Axis<any>;
  xLabelsAxis: d3.Axis<any>;
  stepWidth: number;
  xAxis: d3.Axis<any>;
}

export interface Tooltip {
  isShown: boolean;
  isRightSide: boolean;
  xPosition: number;
  yPosition: number;
  xContent: string;
  yContent: string;
}

export class HistogramUtils {

  public static isSelectionBeyondDataDomain(selectedInputValues: SelectedInputValues,
     inputData: Array<{ key: number, value: number }>): boolean {
    if (inputData.length !== 0) {
      return +selectedInputValues.startvalue < inputData[0].key || +selectedInputValues.endvalue > inputData[inputData.length - 1].key;
    } else {
      return true;
    }
  }

  public static parseDataKey(inputData: Array<{ key: number, value: number }>,
    dataType: DataType, dateUnit: DateUnit): Array<HistogramData> {
      if (dataType === DataType.time) {
        return this.parseDataKeyToDate(inputData, dateUnit);
      } else {
        return inputData;
      }
  }

  public static parseSelectedValues(selectedValues: SelectedInputValues, dataType: DataType, dateUnit: DateUnit): SelectedOutputValues {
    const parsedSelectedValues: SelectedOutputValues = { startvalue: null, endvalue: null };
    if (dataType === DataType.time) {
      if (dateUnit === DateUnit.second && (typeof (<Date>selectedValues.startvalue).getMonth !== 'function')) {
        const multiplier = 1000;
        parsedSelectedValues.startvalue = new Date(<number>selectedValues.startvalue * multiplier);
        parsedSelectedValues.endvalue = new Date(<number>selectedValues.endvalue * multiplier);
      } else if ((typeof (<Date>selectedValues.startvalue).getMonth === 'function')) {
        parsedSelectedValues.startvalue = new Date(<Date>selectedValues.startvalue);
        parsedSelectedValues.endvalue = new Date(<Date>selectedValues.endvalue);
      } else {
        parsedSelectedValues.startvalue = new Date(<number>selectedValues.startvalue);
        parsedSelectedValues.endvalue = new Date(<number>selectedValues.endvalue);
      }
      return parsedSelectedValues;
    } else {
      return selectedValues;
    }
  }

  public static parseSwimlaneDataKey(swimlanesInputData: Map<string, Array<{ key: number, value: number }>>,
    dataType: DataType, dateUnit: DateUnit): Map<string, Array<HistogramData>> {
    const swimlaneParsedDataMap = new Map<string, Array<HistogramData>>();
    swimlanesInputData.forEach((swimlane, key) => {
      if (swimlane !== null && Array.isArray(swimlane) && swimlane.length > 0) {
        swimlaneParsedDataMap.set(key, this.parseDataKey(swimlane, dataType, dateUnit));
      }
    });
    return swimlaneParsedDataMap;
  }

  private static parseDataKeyToDate(inputData: Array<{ key: number, value: number }>, dateUnit: DateUnit) {
    const parsedData = new Array<HistogramData>();
    const multiplier = (dateUnit === DateUnit.second) ? 1000 : 1;
    inputData.forEach(d => {
      parsedData.push({ key: new Date(d.key * multiplier), value: d.value });
    });
    return parsedData;
  }

  public static getColor(zeroToOne: number, paletteColors: [number, number] | string): any {
    // Scrunch the green/cyan range in the middle
    const sign = (zeroToOne < .5) ? -1 : 1;
    zeroToOne = sign * Math.pow(2 * Math.abs(zeroToOne - .5), .35) / 2 + .5;

    // Linear interpolation between the cold and hot
    if (paletteColors === null) {
      const h0 = 259;
      const h1 = 12;
      const h = (h0) * (1 - zeroToOne) + (h1) * (zeroToOne);
      return tinycolor({ h: h, s: 100, v: 90 });
    } else {
      if (paletteColors instanceof Array) {
        const h0 = paletteColors[1];
        const h1 = paletteColors[0];
        const h = (h0) * (1 - zeroToOne) + (h1) * (zeroToOne);
        return tinycolor({ h: h, s: 100, v: 90 });
      } else {
        const color = tinycolor(paletteColors.toString());
        const h = color.toHsl().h;
        const s = color.toHsl().s;
        const l0 = 85;
        const l1 = 20;
        const l = (l0) * (1 - zeroToOne) + (l1) * (zeroToOne);
        return tinycolor({ h: h, s: s, l: l });
      }
    }
  }

  public static toString(value: Date | number, chartType: ChartType, dataType: DataType, dateFormat?: string): string {
    if (value instanceof Date) {
      if (dateFormat && dateFormat !== null) {
        const timeFormat = d3.timeFormat(dateFormat);
        return timeFormat(value);
      } else {
        return value.toDateString();
      }
    } else {
      if (chartType === ChartType.oneDimension) {
        return Math.trunc(value).toString();
      } else {
        if (dataType === DataType.time) {
          const date = new Date(this.round(value, 1));
          return date.toDateString();

        } else {
          return this.round(value, 1).toString();

        }
      }
    }
  }

  private static round(value, precision): number {
    let multiplier;
    if (precision === 1) {
      multiplier = precision;
    } else {
      multiplier = Math.pow(10, precision * 10 || 0);
    }
    return Math.round(value * multiplier) / multiplier;
  }
}

export enum DateUnit {
  second, millisecond
}

export enum SwimlaneMode {
  variableHeight, fixedHeight, circles
}
export enum DataType {
  numeric, time
}

export enum ChartType {
  area, bars, oneDimension, swimlane
}

export enum Position {
  top, bottom
}
