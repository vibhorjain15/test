import {
  Directive,
  ElementRef,
  Input,
  OnInit,
} from '@angular/core';
import { UtilsService } from 'src/app2/services/utils.service';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
import { Select } from '@ngxs/store';
@Directive({
  selector: '[authorized-view]',
})
export class AuthorizedViewDirective implements OnInit {
  @Input() accessibleTo: string;
  @Input() hiddenFrom: string;
  @Select(UserState.getCurrentUserData) user;

  constructor(
    private readonly elementRef: ElementRef,
    private readonly utils: UtilsService,
  ) {}

  ngOnInit(): void {
    let accessibleList: string[] = null;
    let hiddenList: string[] = null;
    if (this.accessibleTo) {
      accessibleList = this.accessibleTo.split(',').map((x) => x.trim());
    }
    if (this.hiddenFrom) {
      hiddenList = this.hiddenFrom.split(',').map((x) => x.trim());
    }
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          if (
            !this.utils.isAuthorized(
              this.utils.getGrantMap(data),
              accessibleList,
              hiddenList
            )
          ) {
            this.elementRef.nativeElement.style.display = 'none';
          }
        }
      });
  }
}
