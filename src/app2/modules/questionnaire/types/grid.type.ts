export interface TypeOptions {
  type: string;
}

export interface RowsColumn {
  id: number;
  name: string;
  grid_id: number;
  grid_version: number;
  elementType: 'Row' | 'Column';
  order: number;
  userID: number;
  insertTimeStamp: Date;
  type: string;
  type_options: TypeOptions;
  group_id: number;
}

export interface GridDataType {
  id: number;
  dataType: string;
  dynamic_element?: any;
  userId: number;
  formulas_json?: any;
  insertTimeStamp: Date;
  rows_columns: RowsColumn[];
  aggregation_json?: any;
}
