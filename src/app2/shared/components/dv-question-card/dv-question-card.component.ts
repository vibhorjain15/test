import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import * as saveAs from 'file-saver';
import { interval } from 'rxjs';
import { UtilsService } from 'src/app2/services/utils.service';
import { TooltipMessage, dvThresholds, Regex } from '../../constants/constant';
import { ColorTheme } from '../../themes/color.themes';

@Component({
  selector: 'dv-question-card',
  templateUrl: './dv-question-card.component.html',
  styleUrls: ['./dv-question-card.component.css'],
})
export class DvQuestionCardComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() title = 'sample one';
  @Input() hintText = '';
  @Input() assignedUser = { users: [], functions: [], assignedFunctions: [] };
  @Input() leftIcons = {
    key: '',
    name: 'check',
    disabled: false,
    color: 'grey',
    tooltip: 'Response not shared yet',
  };
  @Input() rightIcons = [];
  @Input() leftLinks = [];
  @Input() rightLinks = [];
  @Input() showLessRightIcons = false;
  @Input() cardQuestionMap = {};
  @Input() question;
  @Input() isNested = false;

  @Output() onlinkClick = new EventEmitter();
  @Output() onIconClick = new EventEmitter();
  tooltipMessage = TooltipMessage;
  showComment = false;
  iconHover = false;
  ColorTheme = ColorTheme;
  time = dvThresholds.REVIEW_UNDO;
  subscription;
  toggleDropDown = false;
  rightIconsDropdown = [];
  rightIconsCopy = [];
  minDate;
  config;

  constructor(
    private http: HttpClient,
    private elementRef: ElementRef,
    private utils: UtilsService
  ) {}
  get isConditionalQuestion(): boolean {
    return !!(
      this.question &&
      this.question.nestedQuestions &&
      this.question.nestedQuestions.length
    );
  }

  handleLinkClick(link) {
    this.onlinkClick.emit(link);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes?.rightLinks &&
      changes?.rightLinks.currentValue !== changes?.rightLinks.previousValue
    ) {
      this.minDate = new Date();
      this.minDate.setHours(0, 0, 0, 0);
      this.rightLinks = JSON.parse(
        JSON.stringify(changes?.rightLinks.currentValue)
      );
      if (this.question) this.cardQuestionMap[this.question.id] = this.question;
      this.rightLinks.forEach((val) => {
        if (val.key == 'undo') {
          this.time = dvThresholds.REVIEW_UNDO;
          this.subscription = interval(1000).subscribe(() => {
            this.time--;
            if (this.time <= 0) {
              this.undoVerification(val, 'complete');
            }
          });
        }
      });
    }
    if (
      (changes?.rightIcons &&
        changes?.rightIcons.currentValue !==
          changes?.rightIcons.previousValue) ||
      (changes?.showLessRightIcons &&
        changes?.showLessRightIcons.currentValue !==
          changes?.showLessRightIcons.previousValue)
    ) {
      if (this.question) this.cardQuestionMap[this.question.id] = this.question;
      if (changes?.rightIcons?.currentValue)
        this.rightIconsCopy = JSON.parse(
          JSON.stringify(changes?.rightIcons.currentValue)
        );
      this.rightIcons = [...this.rightIconsCopy];
      this.rightIconsDropdown = [];

      // disable exclude rating icon/menu if variable is set for it
      const disableNaRatingIcon = this.rightIcons.find(
        (x) => x.key === 'rating'
      )?.disableNaRatingIcon;
      if (disableNaRatingIcon) {
        this.rightIcons.find((x) => x.key === 'ban').disabled = true;
        this.rightIcons.find((x) => x.key === 'ban').readonly = true;
      }

      if (!this.showLessRightIcons && this.rightIcons.length >= 5)
        this.rightIconsDropdown = this.rightIcons.splice(6).map((icon) => {
          let label = icon.label;
          return { ...icon, label, key: icon.key };
        });
      if (this.showLessRightIcons && this.rightIcons.length >= 3)
        this.rightIconsDropdown = this.rightIcons.splice(3).map((icon) => {
          let label = icon.label;
          return { ...icon, label: label, key: icon.key };
        });
    }
  }

  ngAfterViewInit(): void {
    if (this.elementRef.nativeElement.querySelector('#attachmentUrl')) {
      this.elementRef.nativeElement
        .querySelector('#attachmentUrl')
        .addEventListener('click', this.downloadAttachment.bind(this));
    }
    this.config = {
      dateInputFormat: 'DD-MMMM-YYYY',
      containerClass: 'theme-blue bottom left',
      showWeekNumbers: false,
      adaptivePosition: true,
    };
  }

  handleIconClick(icon) {
    if (!icon.disabled) this.onIconClick.emit(icon);
  }

  handleSubscriber(member, icon) {
    icon.member = member;
    this.onIconClick.emit(icon);
  }

  downloadAttachment(event) {
    const targetUrl = this.utils.extractDownloadUrl(event);
    this.utils.downloadAttachment(targetUrl);
  }

  onDateChange(date, icon, dp) {
    if (icon.disabled) return;
    icon.date = date;
    this.onIconClick.emit(icon);
  }

  undoVerification(link, type: 'undo' | 'complete', section?) {
    this.subscription?.unsubscribe();
    let linkTemp = JSON.parse(JSON.stringify(link));
    if (section) {
      linkTemp.isSection = false;
    }
    linkTemp.type = type;
    this.onlinkClick.emit(linkTemp);
  }

  handleRatingChange(val, icon) {
    if (icon.disabled) return;
    icon.ratingChange = val;
    this.onIconClick.emit(icon);
  }

  handleOnRatingClick(icon) {
    if (icon.disabled) return;
    this.onIconClick.emit(icon);
  }

  handleRatingIconClick(icon) {
    if (icon.disabled) return;
    this.onIconClick.emit(icon);
  }

  ngOnDestroy(): void {
    this.subscription && this.subscription.unsubscribe();
  }

  handleDropDownClick(icon) {
    this.onIconClick.emit(icon);
  }

  naDropDownClick(value, icon) {
    icon.value = value;
    this.onIconClick.emit(icon);
  }
}
