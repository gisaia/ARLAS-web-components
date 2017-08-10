# API

* [Histogram](#Histogram)

## Histogram

A generic component that plots data in a chart. 

### Inputs : 

- `data: Subject<Array<{key: number, value: number}>>` - Data to plot in the histogram. Please, check [data structure](#Data structure)
- `dataType: string` - To be set to **time** when x axis represents time and **numeric** otherwise. Default value is : **numeric**.
- `dataUnit: string` - (Optional) Unit to add in the tooltip
- `chartType: string` - Possible values are **area** and **bars**. Default value is : **area**.
- `chartTitle: string` - The chart title.
- `chartWidth: number` - The chart width.
- `chartHeight: number` - The histogram height.
- `isSmoothedCurve: boolean` - Whether the curve is smoothed or not. Default value is : **true**.
- `dateUnit` - The unit of data key when it represents time. Possible values are **second** and **millisecond**.
- `barWeight` - The weight of bars width. Values are between 0 and 1.
- `customizedCssClass: string` - Css class name.
- `intervalSelection: SelectedInputValues` - The selected interval of values.
- `ticksDateFormat: string` - The date format of ticks. Example : `%B %Y`. Please refer to this [list of specifiers](https://github.com/d3/d3-time-format/blob/master/README.md#locale_format).
- `valuesDateFormat: string` - The date format of the two labels below the chart. Example : `%A %d %B %Y`. Please refer to this [list of specifiers](https://github.com/d3/d3-time-format/blob/master/README.md#locale_format).
- `xTicks: number` - Number of ticks in the X axis.
- `yTicks: number` - Number of ticks in the Y axis.
- `xLabels: number` - Number of labels in the X axis.
- `yLabels: number` - Number of labels in the Y axis.
- `showXTicks: boolean` - Whether showing the x axis ticks or not. Default value is : **true**.
- `showYTicks: boolean` - Whether showing the y axis ticks or not. Default value is : **true**.
- `showXLabels: boolean` - Whether showing the x axis labels or not. Default value is : **true**.
- `showYLabels: boolean` - Whether showing the y axis labels or not. Default value is : **true**.

#### Improvements :
- Add yLabels input : the number of labels in the Y axis.
- Dissociate the number of ticks and the number of labels.

### Outputs : 

- `valuesChangedEvent: EventEmitter<{startvalue: any, endvalue: any}>` - Brush values end event.

### Data structure :

- The input data should be an array of `{ key: number, value: number }` object. 
- `key` represents the **X** axis values.
- `value` represents the **Y** axis values.
- When **X** axis values are **date** values, `key` should be given as timestamp and `[dateType] = "'timeline'"`
