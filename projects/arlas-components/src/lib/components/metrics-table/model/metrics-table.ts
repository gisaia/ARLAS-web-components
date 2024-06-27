export interface MetricsTable {
    header: MetricsTableHeader[];
    data: MetricsTableRow[];
}

export interface MetricsTableHeader {
    title: string;
    subTitle: string;
    metric: string;
    span?: number;
}

export interface MetricsTableData {
    value: number;
    maxValue: number;
}

export interface MetricsTableRow {
    term: string;
    data: MetricsTableData[];
    selected?: boolean;
}
