import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root',
})
export class DvApiSearchService {
  private fundSearch = [];
  private productSearch;
  private firmSearch;
  private vehicleSearch;

  constructor(
    private readonly http: HttpClient,
  ) {
    this.fundSearch = [];
  }

  private entitytype = new Map([
    ['service/dvapi_service/firm_search', this.getfirmSearch.bind(this)],
    ['service/dvapi_service/product_search', this.getproductSearch.bind(this)],
    ['service/dvapi_service/fund_search', this.getFundSearch.bind(this)],
    ['service/dvapi_service/vehicle_search', this.getvehicleSearch.bind(this)],
    ['service/dvapi_service/search_filters', this.getSearchFilters.bind(this)],
  ]);

  private searchFiltersEntity = new Map([]);

  getEntityTypeData(url, params, success) {
    this.entitytype.get(url)(
      params,
      (response) => {
        success(response);
      },
      () => {}
    );
  }

  getSearchFilters(params, success) {
    this.http.post(`service/dvapi_service/search_filters`, params).subscribe(
      (response: any) => {
        this.searchFiltersEntity.set(params.entity_type, response);
        success(response);
      },
      (error) => {}
    );
  }

  private getFundSearch(params, success, failure) {
    this.http.post(`service/dvapi_service/fund_search`, params).subscribe(
      (response: any) => {
        this.fundSearch = response.data;
        success(this.fundSearch);
      },
      (error) => {}
    );
  }

  private getproductSearch(params, success) {
    this.http.post(`service/dvapi_service/product_search`, params).subscribe(
      (response: any) => {
        this.productSearch = response.data;
        success(this.productSearch);
      },
      (error) => {}
    );
  }

  private getfirmSearch(params, success) {
    this.http.post(`service/dvapi_service/firm_search`, params).subscribe(
      (response: any) => {
        this.firmSearch = response.data;
        success(this.firmSearch);
      },
      (error) => {}
    );
  }

  private getvehicleSearch(params, success) {
    this.http.post(`service/dvapi_service/vehicle_search`, params).subscribe(
      (response: any) => {
        this.vehicleSearch = response.data;
        success(this.vehicleSearch);
      },
      (error) => {}
    );
  }
}
