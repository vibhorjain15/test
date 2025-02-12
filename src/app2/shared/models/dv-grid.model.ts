import { AgFrameworkComponent } from "ag-grid-angular";
import { ICellRenderer, ICellRendererParams } from "ag-grid-community";

/**
 * Angular component renderer to bind our custom `ICellRendererParams`
 * @template T Where `T` extends `ICellRendererParams`
 * @extends ICellRenderer
 * @extends AgFrameworkComponent<T>
 * @see `ICellRendererParams`
 */
export interface IDVAngularComp<T extends ICellRendererParams> extends ICellRenderer, AgFrameworkComponent<T> {
}
