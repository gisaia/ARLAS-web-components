import { HistogramData } from "arlas-d3/histograms/utils/HistogramUtils";

export function getMax(data: Array<HistogramData>): number {
    return Math.max(...data.map(hd => +hd.value));
}

export const MAX_CIRLE_RADIUS = 7;
export const MAX_LINE_WIDTH = 10;