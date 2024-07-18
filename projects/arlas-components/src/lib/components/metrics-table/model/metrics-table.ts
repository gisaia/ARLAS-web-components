export interface MetricsTable {
    header: MetricsTableHeader[];
    data: MetricsTableRow[];
}

export interface MetricsTableHeader {
    title: string;
    subTitle: string;
    metric: string;
    span?: number;
    rowfield: string;
}

export interface MetricsTableCell {
    value: number;
    maxColumnValue: number;
    maxTableValue: number;
    metric: string;
    column: string;
    field: string;
}

export interface MetricsTableRow {
    term: string;
    data: MetricsTableCell[];
    selected?: boolean;
}
