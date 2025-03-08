import type { VNode, ComponentPublicInstance } from "vue";
import type { TableColumnCtx } from "element-plus/es/components/table/src/table-column/defaults";
import MyTable from "../index.vue";
import type { MyTableProps } from "../index.vue"

export type TypeProps = "index" | "selection" | "radio" | "expand" | "sort";

export type FieldNamesProps = {
    label: string;
    value: string;
    children?: string;
};

export type RenderScope<T> = {
    row: T;
    $index: number;
    column: TableColumnCtx<T>;
    [key: string]: any;
};

export type HeaderRenderScope<T> = {
    $index: number;
    column: TableColumnCtx<T>;
    [key: string]: any;
};

export interface ColumnProps<T = any>
    extends Partial<Omit<TableColumnCtx<T>, "type" | "children" | "renderCell" | "renderHeader">> {
    type?: TypeProps; // 列类型
    render?: (scope: RenderScope<T>) => VNode | string; // 自定义单元格内容渲染（tsx语法）
    _children?: ColumnProps<T>[]; // 多级表头
}

export type MyTableInstance = Omit<InstanceType<typeof MyTable>, keyof ComponentPublicInstance | keyof MyTableProps>;