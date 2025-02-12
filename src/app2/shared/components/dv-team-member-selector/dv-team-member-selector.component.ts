import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { GetTeamMembers } from 'src/app2/store/user/user.action';
import { UserState } from 'src/app2/store/user/user.state';

@Component({
  selector: 'app-dv-team-member-selector',
  templateUrl: './dv-team-member-selector.component.html',
  styleUrls: ['./dv-team-member-selector.component.css'],
})
export class DvTeamMemberSelectorComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() functions = [];
  @Output() onChange = new EventEmitter();
  @Input() functionSelection = [];
  @Input() selection = [];
  @Input() dropdownPlacement: 'left' | 'right' = 'left';
  @Select(UserState.getTeamMembersData) teamMembers$;
  clear_selection_allowed = true;
  is_open;
  textFilter = '';
  user;
  team_members;
  canShowFunctionLabel = true;
  toggleDropDown:boolean=false;
  private ngUnsubscribe = new Subject<void>();
  constructor(
    private readonly BaseDataService: BaseDataService,
    private readonly store: Store
  ) {}

  ngOnInit() {
    this.getTeamMembers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes?.functionSelection &&
      changes.functionSelection.currentValue !==
        changes.functionSelection.previousValue
    ) {
      let functionIds = this.functionSelection.map((val) => val.function_id);
      this.canShowFunctionLabel = !!this.functions.filter(
        (val) => !functionIds.includes(val.function_id)
      )?.length;
    }
  }

  getFunctions() {
    this.BaseDataService.getFunctions().subscribe((response: any) => {
      this.functions = response;
    });
  }

  getTeamMembers() {
    this.teamMembers$
      .pipe(
        takeUntil(this.ngUnsubscribe),
        tap((userData) => {
          if (!userData) {
            this.store.dispatch(new GetTeamMembers());
          }
        })
      )
      .subscribe((teamMembers) => {
        if (teamMembers) {
          this.team_members = JSON.parse(JSON.stringify(teamMembers));
          this.team_members = this.team_members.map((member) => {
            return {
              ...member,
              joinedName: member.firstName + ' ' + member.lastName,
            };
          });
        }
      });
  }

  showMember(member) {
    const user = this.selection?.find(
      (selection) => selection.id === member.id
    );
    return !user;
  }

  showFunction(member) {
    const func = this.functionSelection?.find(
      (selection) => selection.function_id === member.function_id
    );
    return !func;
  }

  select(user, type, trigger = true) {
    this.is_open = false;
    this.textFilter = '';
    user.is_removed = false;
    if (trigger) {
      this.triggerOnChange({ ...user }, type);
    }
  }

  clearSelection(event, user, type) {
    event.stopPropagation();
    this.is_open = false;
    user.is_removed = true;
    this.triggerOnChange({ ...user }, type);
  }

  formatTooltip(list, list2) {
    const list_of_names = list.map((user) => user.fullName);
    const list_of_functions = list2.map((func) => func.function_name);
    return `Assigned to ${list_of_names.concat(list_of_functions).join(', ')}`;
  }

  triggerOnChange(member, type) {
    this.onChange.emit({ member, type });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe?.next();
    this.ngUnsubscribe?.complete();
  }
}
