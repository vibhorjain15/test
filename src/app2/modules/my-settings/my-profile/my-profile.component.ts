import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { take, tap } from 'rxjs/operators';
// import { SetLanguageCode } from 'src/app2/store/actions/user.action';
// import { TranslateService } from '@ngx-translate/core';
import { UserState } from 'src/app2/store/user/user.state';
import { Select, Store } from '@ngxs/store';
import { languageCodeMap } from 'src/app2/shared/constants/constant';
import {
  GetCurrentUser,
  GetLanguageCode,
} from 'src/app2/store/user/user.action';
import { UserService } from 'src/app2/services/user.service';

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.css'],
})
export class MyProfileComponent implements OnInit {
  loading;
  mode;
  user: any;
  countries: any;
  userModel: any;
  templateName: string;
  saving: boolean;
  // @Select(UserState.getLanguageCode) languageCode$;
  @Select(UserState.getLanguageCodeData) languageCode$;
  userLanguage: any = { name: 'English', code: 'en' };
  @Select(UserState.getCurrentUserData) user$;
  currentUser: any;

  constructor(
    private readonly http: HttpClient,
    private readonly store: Store,
    private readonly toaster: ToastrService,
    private readonly UserService: UserService
  ) {}

  ngOnInit(): void {
    this.user$
      .pipe(
        take(2),
        tap((userData) => {
          if (!userData) {
            this.store.dispatch(new GetCurrentUser());
            this.store.dispatch(new GetLanguageCode());
          }
        })
      )
      .subscribe((user) => {
        if (user) {
          this.currentUser = user;
          this.languageCode$.pipe(take(2)).subscribe((languageCode) => {
            this.userLanguage =
              languageCodeMap.find(
                (language) => language.code === languageCode
              ) ?? 'English';
          });
          this.loadData();
        }
      });
  }

  loadData() {
    const promises = [];
    promises.push(
      this.UserService.getCurrentUserProfile().pipe(
        tap((response: any) => {
          this.user = response;
        })
      )
    );
    promises.push(
      this.http.get('country').pipe(
        tap((response: any) => {
          this.countries = response;
        })
      )
    );
    this.loading = true;
    forkJoin(promises).subscribe(() => {
      this.loading = false;
      this.userModel = { ...this.user };
    });
  }


  cancel() {
    this.loadData();
  }

  submit(userModel) {
    this.saving = true;
    this.http.put('users/' + this.currentUser.id, userModel).subscribe(
      (response: any) => {
        const message = 'Your profile changes have been saved!';
        this.user = { ...this.user, ...response };
        this.toaster.success(message);
        this.saving = false;
        if (userModel.languageCode !== this.userLanguage.code) {
          this.http
            .put('Users/my-profile/switch_primary_language', {
              language_code: userModel.languageCode,
            })
            .subscribe((response) => {
              this.store.dispatch(new GetLanguageCode());
              this.userLanguage = languageCodeMap.find(
                (language) => language.code === userModel.languageCode
              );
            });
        }
      },
      (e) => (this.saving = false)
    );
  }

}

