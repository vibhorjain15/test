import {
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
} from '@angular/core';

type title = {
  text: string;
  icon: string;
};

@Component({
  selector: 'dv-menu-list',
  templateUrl: './dv-menu-list.component.html',
  styleUrls: ['./dv-menu-list.component.css'],
})
export class DvMenuListComponent {
  @Input() title = {
    text: 'Firm Settings',
    icon: 'institution',
  };
  @Input() menuListData = [];
  @Input() currentActive: any = {};
  @Output() onParentMenuClick = new EventEmitter();
  @Output() onChildMenuClick = new EventEmitter();

  states: any = [];
  currentState = '';
  currentLabel = '';
  currentSubState;
  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes?.currentActive &&
      changes.currentActive.currentValue !== changes.currentActive.previousValue
    ) {
      if (this.currentActive?.parentMenu) {
        this.currentSubState = this.currentActive.parentMenu.label;
      }
    }
  }

  ngAfterViewInit(): void {
    this.getLatestState(null, this.menuListData, window.location.pathname);
  }

  getLatestState(parent, states, path) {
    states.forEach((state) => {
      if (path.includes(state.name)) {
        if (parent) {
          this.currentSubState = parent.label;
          this.currentLabel = state.label;
        } else {
          this.currentLabel = state.label;
          this.currentSubState = '';
        }
      }
      if (state?.subStates) this.getLatestState(state, state?.subStates, path);
    });
  }

  handleMenuClick(state, nested) {
    this.currentLabel = state.label;
    if (!nested) this.currentSubState = '';
    this.onParentMenuClick.emit(state);
  }

  toggleStateCollapse(state) {
    if (this.currentSubState == state.label) {
      this.currentSubState = '';
    } else this.currentSubState = state.label;
    this.onChildMenuClick.emit(state);
  }
}
