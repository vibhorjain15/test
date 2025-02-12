import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

type CategoryList = {
  label: string;
  isOpen: boolean;
  isCatSelected: boolean;
  list: {
    id: number;
    name: string;
    isSelected: boolean;
  }[];
};
@Component({
  selector: 'dv-category-accordion-list',
  templateUrl: './dv-category-accordion-list.component.html',
  styleUrls: ['./dv-category-accordion-list.component.css'],
})
export class DvCategoryAccordionListComponent implements OnInit {
  @Input() isCheckbox = false;
  @Input() currentActiveId = 1;
  @Output() onSubCatClick = new EventEmitter();
  @Output() onCatClick = new EventEmitter();
  @Input() categoryData: CategoryList[] = [];
  @Input() showQuestionCount: boolean = false;

  loading = true;

  ngOnInit(): void {
    if (this.isCheckbox) this.currentActiveId = -1;
  }

  handleCatClick(event, data): void {
    event.stopPropagation();
    data.isOpen = !data.isOpen;
    this.onCatClick.emit(data);
  }
  handleSubCatClick(data) {
    if (!this.isCheckbox) {
      data.isSelected = !data.isSelected;
      this.currentActiveId = data.id;
      this.onSubCatClick.emit({
        catData: this.categoryData,
        currentActivesection: data,
      });
    } else this.currentActiveId = -1;
  }

  handleStopAccordion(event) {
    event.stopPropagation();
  }

  handelCatLevelSelection(event, index) {
    this.categoryData[index].isCatSelected = event;
    this.categoryData[index].list.forEach((val) => (val.isSelected = event));
  }
  handelSubCatLevelSelection(event, index, cat, subData) {
    if (event) subData.isSelected = event;
    else cat.isCatSelected = false;
    if (cat.list.filter((val) => !val.isSelected).length === cat.list.length)
      cat.isCatSelected = false;
    if (cat.list.filter((val) => val.isSelected).length === cat.list.length)
      cat.isCatSelected = true;
  }
}
