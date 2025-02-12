import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'app-search-input',
  templateUrl: './search-input.component.html',
  styleUrls: ['./search-input.component.css'],
})
export class SearchInputComponent implements OnInit, OnDestroy, OnChanges {
  @Input() routerState;
  @Input() placeholder = 'Search for documents...';
  @Output() onSearch = new EventEmitter();
  @Output() onClear = new EventEmitter();
  @Input() searchOnType: boolean = false;
  @Input() searchText = '';

  statusFilter;
  searchTextNew = this.searchText;
  stateParams: any;
  searchInUrl = true;

  private _searchTextSubscription: Subscription;
  private _searchText: Subject<string>;

  constructor(private readonly routerService: RouterService) {}

  ngOnInit(): void {
    this.stateParams = this.routerService.getState().params;
    if (this.routerState && this.searchInUrl) {
      this.searchText = this.stateParams.q || '';
      this.searchTextNew = this.stateParams.q || '';
    }
    this.statusFilter = this.stateParams.status || 'default';
    this._searchText = new Subject<string>();
    if (this.searchOnType) {
      this.handleSearchTextChange();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.searchText && changes.searchText.firstChange) {
      this.searchInUrl = false;
    }
    if (
      changes.searchText &&
      changes.searchText.currentValue !== changes.searchText.previousValue
    ) {
      this.searchTextNew = this.searchText;
    }
  }

  onChange(searchText: string): void {
    if (searchText.trim().length === 0) return this.resetFilter();
    if (this.searchOnType) {
      this._searchText.next(searchText);
    }
  }

  handleSearchTextChange(): void {
    this._searchTextSubscription = this._searchText
      .pipe(debounceTime(200), distinctUntilChanged())
      .subscribe((value) => {
        if (this.searchOnType) {
          this.onSearch.emit(value);
        }
      });
  }

  searchDocuments() {
    if (this.searchTextNew !== this.searchText) {
      if (this.searchTextNew.trim().length === 0) return this.resetFilter();

      this.searchText = this.searchTextNew;
      this.statusFilter = 'Search';
      if (!this.routerState || !this.searchInUrl)
        return this.onSearch.emit(this.searchText);

      this.routerService.navigateWithParams(this.routerState, {
        status: 'Search',
        q: this.searchTextNew,
      });
    }
  }

  resetFilter() {
    this.searchText = '';
    this.searchTextNew = '';
    this.statusFilter = 'default';
    if (!this.routerState || !this.searchInUrl)
      return this.onClear.emit(this.searchText);
    this.routerState = `${this.routerState}`.split('?')[0]; // removing all query params
    this.routerService.navigateWithParams(this.routerState, {
      status: null,
      q: null,
    });
  }

  ngOnDestroy(): void {
    this._searchTextSubscription?.unsubscribe();
  }
}
