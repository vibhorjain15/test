import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'add-strategy',
  templateUrl: './add-strategy.component.html',
})
export class AddStrategyTagsModal implements OnInit {
  @Input() strategies;
  @Input() strategy;
  @Input() onSuccess;
  loading;
  newOptions = [];
  existingStrategies;
  edit_mode;
  name = '';
  saving;

  constructor(
    private readonly toaster: ToastrService,
    private readonly http: HttpClient
  ) {}
  ngOnInit(): void {
    if (this.strategies) {
      this.existingStrategies = {};
      this.strategies.map((val) => {
        this.existingStrategies[val.name] = val.name;
      });
    }
    if (this.strategy) {
      this.edit_mode = true;
      this.name = this.strategy.name;
    }
  }

  save(cb) {
    if (!this.edit_mode) {
      if (this.newOptions.length == 0) {
        this.toaster.error('Atleast add one classification');
        return;
      }
      let localName = {};
      for (let i = 0; i < this.newOptions.length; i++) {
        let name = this.newOptions[i].text?.trim();
        if (localName[name]) {
          this.toaster.error(` Please remove duplicate classification ${name}`);
          return;
        }
        localName[name] = name;
        if (this.existingStrategies[name]) {
          this.toaster.error(`${name} aready exist in custom classifications.`);
          return;
        }
      }
    }
    this.saving = true;
    let params;
    if (this.edit_mode) {
      params = [this.strategy];
      params[0].is_active = true;
      params[0].name = this.name;
    } else {
      params = this.newOptions.map((val) => ({ name: val.text?.trim() }));
    }

    this.http.put('strategies', params).subscribe(
      (res) => {
        this.toaster.success('Classification successfully added!');
        this.saving = false;
        if (this.edit_mode) {
          this.onSuccess(params);
        } else {
          this.onSuccess(res);
        }
        cb();
      },
      () => (this.saving = false)
    );
  }
}
