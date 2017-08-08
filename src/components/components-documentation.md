# API

* [Histogram](#Histogram)

## Histogram

A generic component that plots data in a chart. 

### Inputs : 

- `data: Subject<Array<{key: number, value: number}>>` - Data to plot in the histogram. Please, check [data structure](#Data structure)
- `dataType: string` - To be set to **time** when x axis represents time and **numeric** otherwise.
- `dataUnit: string` - (Optional) Unit to add in the tooltip
- `chartType: string` - Possible values are **area** and **bars**.
- `chartTitle: string` - The chart title.
- `chartWidth: number` - The chart width.
- `chartHeight: number` - The histogram height.
- `dateUnit` - The unit of data key when it represents time. Possible values are **second** and **millisecond**.
- `xTicks: number` - Number of ticks in the X axis. Used when chartType = area.
- `yTicks: number` - Number of ticks in the Y axis.
- `xLabels: number` - Number of labels in the X axis. Used when chartType = bars.
- `barWeight` - The weight of bars width. Values are between 0 and 1.
- `customizedCssClass: string` - Css class name.

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
