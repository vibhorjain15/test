import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { FundDataService } from './fund-data.service';

@Injectable({
  providedIn: 'root',
})
export class ShareClassTableService {
  constructor(private readonly FundDataservice: FundDataService) {}

  getYearsForShareClassTableValues(share_class_table_values) {
    const years = share_class_table_values.map((value) =>
      moment(value.start_date).year()
    );
    // return years.uniq();
    return years;
  }

  getYearsBasedOnInceptionDate(inception_date) {
    let min_year: number;
    if (inception_date == null) {
      return [];
    }
    const inception_year = moment(inception_date).year();
    const current_year = moment().year();
    if (current_year - inception_year > 20) {
      min_year = current_year - 20;
    } else {
      min_year = inception_year;
    }
    return this.__range__(min_year, current_year, true);
  }

  getYears(values, share_class) {
    const inception_date_years = this.getYearsBasedOnInceptionDate(
      share_class.inceptionDate
    );
    const value_years = this.getYearsForShareClassTableValues(values);
    // TODO
    const years = [...new Set([...inception_date_years, ...value_years])];
    years.sort((a, b) => a - b);
    return years;
  }

  calculateNetReturn(returns) {
    let net = 1;
    returns.forEach((value) => (net *= 1 + value / 100));
    net -= 1;
    net *= 100;
    return net;
  }

  calculateNetAUM(returns) {
    // return _(_(returns).compact()).last();
    return returns.filter((r) => r).at(-1) ?? 0;
  }

  getColumns(share_class_table, include_total_column?, readonly = false) {
    let columns;
    const col_defaults = { readonly };
    const months = moment.months();
    switch (share_class_table.period) {
      case 'Monthly':
        columns = months.map((name, idx) => {
          let column = {
            name: name.slice(0, 3),
            start_month_idx: idx,
            end_month_idx: idx,
          };
          column = { ...column, ...col_defaults };
          return column;
        });
        break;
      case 'Quarterly':
        var quarters = [1, 2, 3, 4];
        var idx = 0;
        columns = quarters.map(() => {
          const start_month_idx = idx;
          const end_month_idx = idx + 2;
          let column = {
            name: `${months[start_month_idx].slice(0, 3)}-${months[
              end_month_idx
            ].slice(0, 3)}`,
            start_month_idx,
            end_month_idx,
          };
          // _(column).extend(col_defaults);
          column = { ...column, ...col_defaults };
          idx += 3;
          return column;
        });
        break;
    }
    if (include_total_column || share_class_table.type === 'track_record') {
      columns.push({ name: 'YTD', readonly: true });
    }
    return columns;
  }

  getRows(share_class_table, values, share_class, include_total_column?) {
    const years = this.getYears(values, share_class);
    const columns = this.getColumns(share_class_table, include_total_column);
    if (!years.length) {
      years.push(moment().year());
    }
    return years.map((year) => {
      const row: any = {};
      row['year'] = year;
      columns.forEach((column) => {
        const cell = this.findOrCreateCell({
          start_month_idx: column.start_month_idx,
          end_month_idx: column.end_month_idx,
          values,
          year,
          shareclass_table_id: share_class_table.id,
        });
        row[column.name] = cell;
        if (cell.is_total_cell) {
          row.total_cell = cell;
        }
      });
      this.computeTotal(row, share_class_table);
      return row;
    });
  }

  getRowsNew(share_class_table, values, share_class, include_total_column?) {
    const years = this.getYears(values, share_class);
    const columns = this.getColumns(share_class_table, include_total_column);
    if (!years.length) {
      years.push(moment().year());
    }
    return years.map((year) => {
      const row: any = { ...year };
      columns.forEach((column) => {
        const cell = this.findOrCreateCell({
          start_month_idx: column.start_month_idx,
          end_month_idx: column.end_month_idx,
          values,
          year,
          shareclass_table_id: share_class_table.id,
        });
        row[column.name] = cell;
        if (cell.is_total_cell) {
          row.total_cell = cell;
        }
      });
      this.computeTotal(row, share_class_table);
      return row;
    });
  }

  findOrCreateCell(options) {
    const { start_month_idx } = options;
    const { end_month_idx } = options;
    const { shareclass_table_id } = options;
    const { year } = options;
    let cell = options.values.find((value) => {
      const start_date = moment(value.start_date);
      const end_date = moment(value.end_date);
      return (
        start_date.month() === start_month_idx &&
        end_date.month() === end_month_idx &&
        start_date.year() === year &&
        end_date.year() === year
      );
    });
    if (cell) {
      cell._value = cell.value;
    } else {
      cell = this.createNewCell(
        year,
        start_month_idx,
        end_month_idx,
        shareclass_table_id
      );
    }
    return cell;
  }

  computeTotal(row, share_class_table) {
    const { total_cell } = row;
    const { type } = share_class_table;
    if (!total_cell) {
      return;
    }
    const returns = [];
    for (let key of Object.keys(row || {})) {
      const cell = row[key];
      if (cell !== total_cell) {
        var ret: any;
        if (type === 'track_record') {
          ret = cell.value || 0;
        } else if (type === 'aum') {
          ret = cell.value;
        }
        returns.push(ret);
      }
    }
    if (type === 'track_record') {
      total_cell.value = this.calculateNetReturn(returns);
    } else if (type === 'aum') {
      total_cell.value = this.calculateNetAUM(returns);
    }
    total_cell.value = Number(total_cell.value.toFixed(2));
  }

  createNewCell(
    year,
    start_month_idx,
    end_month_idx,
    aumtrackrecord_defintion_id
  ) {
    const date_format = 'YYYY-MM-DDTHH:mm:ss';
    if (
      (start_month_idx !== 0 || end_month_idx !== 0) &&
      !start_month_idx &&
      !end_month_idx
    ) {
      return { is_total_cell: true };
    } else {
      const cell = {
        start_date: moment(new Date(year, start_month_idx))
          .startOf('month')
          .format(date_format),
        end_date: moment(new Date(year, end_month_idx))
          .endOf('month')
          .format(date_format),
        aumtrackrecord_defintion_id,
      };
      return cell;
      /* return this.FundDataservice.newShareClassTableValue(
        aumtrackrecord_defintion_id,
        cell
      ); */
    }
  }

  __range__(left, right, inclusive) {
    let range = [];
    let ascending = left < right;
    let end = !inclusive ? right : ascending ? right + 1 : right - 1;
    for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
      range.push(i);
    }
    return range;
  }
}
