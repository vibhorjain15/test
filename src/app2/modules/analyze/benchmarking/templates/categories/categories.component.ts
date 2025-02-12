import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { RouterService } from 'src/app2/services/router.service';
import { TemplateDataService } from 'src/app2/services/templateData/template.service';

@Component({
  selector: 'categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css'],
})
export class AnalyzeTemplateCategoriesComponent implements OnInit {
  templateId: number;
  stateParams: any;
  tagId: any;
  start_date: any;
  child_section_show: boolean = true;
  end_date: any;
  selectedRange: any;
  parent_sections: any;
  sectionId: number;
  questionCount: number = 0;
  routeSubscription: any;
  range: any;

  constructor(
    private readonly TemplatesDataService: TemplateDataService,
    private readonly router: RouterService,
    private routerState: ActivatedRoute,
    private route: Router
  ) {}

  ngOnInit() {
    this.init();
    this.getParentSections();
    this.routeSubscription=this.route.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.init();
    });
  }

  init() {
    this.stateParams = this.router.getState(this.routerState).params;
    this.templateId = +this.stateParams.templateId;
    this.tagId = this.stateParams.tagId;
    this.start_date = this.stateParams.start_date;
    this.end_date = this.stateParams.end_date;
    this.selectedRange = this.stateParams.selectedRange;
    this.sectionId=this.stateParams.categoryId;
    this.range = this.stateParams.range;
  }

  getParentSections() {
    this.TemplatesDataService.getSections(this.templateId, {
      params: {
        isParent: true,
      },
    }).subscribe((response: any) => {
      this.parent_sections = response;
      if (this.parent_sections?.length) {
        if(!this.sectionId){
          this.sectionId = this.parent_sections[0].id;
        }
        this.getQuestionCount(this.sectionId);
        this.router.navigateWithParams('app.analyze.templates.categories.responses', {
          categoryId: this.sectionId,
          templateId: this.templateId,
          tagId: this.tagId,
          start_date: this.start_date,
          end_date: this.end_date,
          selectedRange: this.selectedRange,
          range:this.range
        });
      }
    });
  }

  handleRouting(id) {
    this.getQuestionCount(id);
    this.sectionId = id;
    this.router.navigateWithParams('app.analyze.templates.categories.responses', {
      categoryId: id,
      templateId: this.templateId,
      tagId: this.tagId,
      start_date: this.start_date,
      end_date: this.end_date,
      selectedRange: this.selectedRange,
      range:this.range
    });
    this.child_section_show = false;
    setTimeout(() => {
      this.child_section_show = true;
    }, 100);
  }
  getQuestionCount(id){
    this.questionCount = 0;
    let index = this.parent_sections.findIndex((xy: any) => xy.id == id);
    for (let i = 1; i <= index; i++) {
      this.questionCount =
        index == 1
          ? this.parent_sections[i - 1]?.question_counts
          : this.questionCount + this.parent_sections[i - 1]?.question_counts;
    }
  }
  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }
}
