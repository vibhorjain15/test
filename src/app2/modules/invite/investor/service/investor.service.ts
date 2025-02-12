import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export enum filterEnum {
  subEntitiesSection = 'subEntitiesSection',
  entitiesSelection = 'entitiesSelection',
}

type filterType = 'subEntitiesSection' | 'entitiesSelection';
@Injectable({
  providedIn: 'root',
})
export class InvestorService {
  private dataSubject = new BehaviorSubject<any>(false);
  nextButtonData$ = this.dataSubject.asObservable();
  entitySelector: {
    [id: string | filterType]: {
      show: boolean;
      contact_id: number | null;
      tagData: any[];
    };
  } = {
    entitiesSelection: {
      show: false,
      contact_id: null,
      tagData: [],
    },
    subEntitiesSection: {
      show: false,
      contact_id: null,
      tagData: [],
    },
  };

  constructor() {}

  getEntitySelectorFilters(type) {
    return this.entitySelector[type];
  }

  updatedEntitySelectorFilters(type, filter) {
    this.entitySelector[type] = {
      ...filter,
      tagData: this.entitySelector[type].tagData,
    };
  }
  resetEntitySelectorFilters(type) {
    this.entitySelector[type] = {
      show: false,
      contact_id: null,
      tagData: this.entitySelector[type].tagData,
    };
  }

  storeContactTags(type, data) {
    this.entitySelector[type].tagData = data;
  }
  getContactTags(type) {
    return this.entitySelector[type].tagData;
  }
  disableNextButton(data: any) {
    this.dataSubject.next(data);
  }
}
