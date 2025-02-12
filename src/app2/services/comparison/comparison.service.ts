import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ComparisonAngularDataService {
  comparison_dates = {};
  selections: any = {};
  comparison_ids = [];
  comparison_data = [];
  setComparisonDates(dates: any) {
    return (this.comparison_dates = dates);
  }

  getComparisonDates(dates: any) {
    return this.comparison_dates;
  }

  setComparisonIds(ids: any) {
    return (this.comparison_ids = ids);
  }

  getComparisonIds() {
    return this.comparison_ids;
  }

  setComparisonData(data: any) {
    return (this.comparison_data = JSON.parse(JSON.stringify(data)));
  }

  removeFromArr(
    index: any,
    arr: { splice: (arg0: any, arg1: number) => void }
  ) {
    arr.splice(index, 1);
    return arr;
  }

  filterRemoved(ids: any, data: any) {
    data.forEach((item: { response: any }) => {
      const protoArr = [];
      item.response.forEach((innerRes: { id: any }) => {
        if (!Array.from(ids).includes(innerRes.id)) {
          return protoArr.push(innerRes);
        }
      });
      return (item.response = protoArr);
    });

    return data;
  }

  setSelections(data: any) {
    return (this.selections = data);
  }

  getSelections() {
    return this.selections;
  }

  getComparisonData() {
    return this.comparison_data;
  }

  sortByLastUpdated(array: any) {
    return array.map((item: { response }) => {
      item.response = item.response.sort(
        (a, b) =>
          (new Date(a.lastupdate_at) as any) -
          (new Date(b.lastupdate_at) as any)
      );
      return item;
    });
  }
}
