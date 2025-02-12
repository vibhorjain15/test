import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CacheUtil {
  GRIDCACHE = {};
  OPTIONCACHE = {};
  AUMCACHE = {};
  SUGGESTION_IDS = {};

  clearCache() {
    this.GRIDCACHE = {};
    this.OPTIONCACHE = {};
    this.AUMCACHE = {};
    this.SUGGESTION_IDS = {};
  }

  deleteGridRows(id) {
    if (this.GRIDCACHE[id]?.rows_columns) {
      this.GRIDCACHE[id].rows_columns = this.GRIDCACHE[
        id
      ]?.rows_columns?.filter((item) => item.elementType != 'Row');
    }
  }

  updateSuggestionIds(questionId: string, suggestionIds: Array<string>): void {
    this.SUGGESTION_IDS[questionId] = suggestionIds;
  }

  clearGridCacheById(id) {
    delete this.GRIDCACHE[id];
  }
}
