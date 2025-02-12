import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { DvDraftService } from '../../service/draft.service';
import {
  UpdateActiveSection,
  UpdateCategory,
  UpdateDraftData,
} from '../../store/questionnaire.action';
import { QuestionState } from '../../store/questionnaire.state';
import { DvCategoryAccordionListComponent } from 'src/app2/shared/components';
import { takeUntil } from 'rxjs/operators';
import { ScrollTopButtonService } from 'src/app2/shared/components/scroll-top-button/scroll-top-button.service';

@Component({
  selector: 'category-list',
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.css'],
})
export class CategoryListComponent implements OnInit, OnDestroy {
  categoryData;
  activeSectionId;
  @Select(QuestionState.getCategoriesData) categories;
  @ViewChild('accordionList') accordionList: DvCategoryAccordionListComponent;
  private ngUnsubscribe = new Subject<void>();
  constructor(
    private store: Store,
    private draftService: DvDraftService,
    private readonly autoScrollTop: ScrollTopButtonService
  ) {}
  ngOnInit(): void {
    this.categories
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(({ categories, activeSection }) => {
        if (categories && activeSection) {
          this.activeSectionId = activeSection.id;
          let cat = Object.values(JSON.parse(JSON.stringify(categories)));
          cat.sort(
            (a: any, b: any) => a.destination_index - b.destination_index
          );
          this.categoryData = cat.map((val: any) => {
            let list = Object.values(val.list);
            list.sort(
              (a: any, b: any) => a.destination_index - b.destination_index
            );
            val.list = list;
            return val;
          });
        }
      });
  }

  handleCatClick(catData) {
    this.store.dispatch(new UpdateCategory(catData));
  }

  handleSubCatClick({ catData, currentActivesection }) {
    this.draftService.showCountAlert(
      () => {
        this.store.dispatch(new UpdateDraftData(null, true));
        this.updateActiveSection(catData, currentActivesection);
      },
      () => {
        this.accordionList.currentActiveId = this.activeSectionId;
        this.store.dispatch(new UpdateDraftData(null));
        this.updateActiveSection(catData, currentActivesection);
      }
    );
  }

  updateActiveSection(catData, currentActivesection) {
    this.activeSectionId = currentActivesection.id;
    this.autoScrollTop.scrollToTop.emit();
    this.store.dispatch(
      new UpdateActiveSection({
        id: currentActivesection.id,
        label: currentActivesection.label,
        data: currentActivesection,
        catData,
      })
    );
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
