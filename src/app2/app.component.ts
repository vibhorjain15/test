import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Store } from '@ngxs/store';
import { GetLanguageCode } from './store/user/user.action';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  constructor(
    public translate: TranslateService,
    private readonly store: Store
  ) {
    document.getElementById('loader').remove();
    translate.addLangs(['en', 'kn', 'hi', 'ja']);
    translate.use('en');
    this.store.dispatch(new GetLanguageCode());
  }
  ngOnInit() {
    console.log('app comp');
  }
}
