import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { GetCurrentUser } from 'src/app2/store/user/user.action';
import { UserState } from 'src/app2/store/user/user.state';
import { Select, Store } from '@ngxs/store';
import { takeUntil, tap } from 'rxjs/operators';
import { Subject } from 'rxjs';
@Component({
  selector: 'app-user-avatar',
  templateUrl: './user-avatar.component.html',
  styleUrls: ['./user-avatar.component.css'],
})
export class UserAvatarComponent implements OnInit, OnDestroy {
  @Input() avatarImgClass? = '';
  @Input() avatarClass? = '';
  @Input() avatarIconSize? = '';
  @Input() avatarIconClass? = '';
  @Input() inputUser? = '';
  @Input() user?;
  current_user;
  @Select(UserState.getCurrentUserData) user$;
  private ngUnsubscribe = new Subject<void>();
  constructor(private readonly store: Store) {}

  ngOnInit(): void {
    this.user$
      .pipe(
        takeUntil(this.ngUnsubscribe),
        tap((userData) => {
          if (!userData) {
            this.store.dispatch(new GetCurrentUser());
          }
        })
      )
      .subscribe((user) => {
        if (user) {
          this.current_user = user;
          if (!this.user) this.user = this.inputUser || this.current_user;
        }
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe?.next();
    this.ngUnsubscribe?.complete();
  }
}
