import { TitleCasePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Select, Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, of } from 'rxjs';
import { finalize, take, tap } from 'rxjs/operators';
import {
  deleteIssueTag,
  updateIssueTags,
} from 'src/app2/modules/recommendation/store/recommendation.action';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { Regex } from 'src/app2/shared/constants/constant';
import { UserState } from 'src/app2/store/user/user.state';
import swal from 'sweetalert2/dist/sweetalert2.js';

@Component({
  selector: 'app-tags-manager',
  templateUrl: './tags-manager.component.html',
  styleUrls: ['./tags-manager.component.css'],
})
export class TagsManagerComponent implements OnInit {
  @Input() tag;
  @Input() tagsValue;
  @Input() tagLabel = 'tag';
  is_admin;
  actionLabel;
  message;
  new_tag_params;
  saving_tags: boolean;
  tags_pattern: any;
  templateUrl: string;
  @ViewChild('pop') pop;
  showError = false;
  @Select(UserState.getCurrentUserData) user;

  constructor(
    private readonly SweetAlert: SweetAlertService,
    private readonly http: HttpClient,
    private readonly toaster: ToastrService,
    private readonly store: Store,
    private readonly titleCase: TitleCasePipe
  ) {}

  private minLength(control: FormControl) {
    if (control.value.trim().length < 2) {
      return {
        minLength: true,
      };
    }
    return null;
  }

  private pattern(control: FormControl) {
    let regex = new RegExp('^[^+@=\\-]|^$');
    if (!regex.test(control.value)) {
      return {
        pattern: true,
      };
    }
    return null;
  }

  public validators = [this.minLength, this.pattern];

  public errorMessages = {
    minLength: 'Minimum 2 characters',
    pattern: 'Cannot start with a special character',
  };

  ngOnInit(): void {
    this.user.pipe(take(1))
      .subscribe((user) => {
        if (user) {
          this.is_admin = user.isAdmin;
        }
      });
    this.new_tag_params = {};
    this.new_tag_params.list = [];
    this.saving_tags = false;
    this.tags_pattern = Regex.avoidFirstSplCharacter;
    this.templateUrl = 'firm/add-tags.html';
    this.actionLabel = `Add a ${this.tagLabel} in ${this.tag.label}`;
    this.message = `No ${this.tagLabel}s available. Why not add for ${this.tag.desc}?`;
  }

  sortTags() {
    this.tagsValue.sort((a, b) => {
      const nameA = a.name?.toLowerCase();
      const nameB = b.name?.toLowerCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });
  }

  displayTagRemovalConfirmation(tag) {
    this.SweetAlert.confirm({
      title: `Are you sure you want to remove \"${tag.name}\"? Existing assignments will be deleted.`,
      confirmButtonText: 'Yes',
      focusCancel: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.removeTag(tag, resolve);
        });
      },
    }).then(() => {
      swal.close();
    });
  }

  removeTag(tag, resolve) {
    this.http
      .delete(`tags/${tag.id}`)
      .pipe(finalize(() => resolve()))
      .subscribe(() => {
        this.toaster.success(
          `${this.titleCase.transform(this.tagLabel)} deleted successfully!`
        );
        if (this.tag.name == 'Issue') {
          this.store.dispatch(new deleteIssueTag(tag));
        }
        this.tagsValue.splice(this.tagsValue.indexOf(tag), 1);
      });
  }

  handleTagsInput(data) {
    const tagsCopy = [...this.new_tag_params.list];
    this.new_tag_params.list = [];
    tagsCopy.forEach((tag: any) => {
      if ((tag.display as string).includes(',')) {
        const newTags: string[] = tag.display.trim().split(',');
        newTags.forEach((newTag) => {
          if (
            (this.new_tag_params.list as Array<any>).findIndex(
              (et) => et.display.trim() === newTag.trim()
            ) === -1
          ) {
            this.new_tag_params.list.push({
              display: newTag.trim(),
              value: newTag.trim(),
            });
          }
        });
      } else {
        this.new_tag_params.list.push({
          display: tag.display?.trim(),
          value: tag.value?.trim(),
        });
      }
    });
  }

  saveTags() {
    if (!this.new_tag_params.list.length) {
      this.showError = true;
      return;
    } else {
      this.showError = false;
    }
    const tags = this.new_tag_params.list.map((tag) => tag.value);
    if (tags.length) {
      const promises = tags.map((tag) => {
        const tag_exists = this.tagsValue.some(
          (tag_item) => tag_item.name.toLowerCase() === tag.toLowerCase()
        );
        if (!tag_exists) {
          const promise = this.http
            .post('tags', {
              name: tag,
              type: this.tag.name,
            })
            .pipe(
              tap((response: any) => {
                this.tagsValue.push(response);
                if (response.type == 'Issue') {
                  this.store.dispatch(new updateIssueTags(this.tagsValue));
                }
                this.sortTags();
              })
            );
          return promise;
        } else {
          this.toaster.info(
            `${this.titleCase.transform(this.tagLabel)} ${tag} already exists!`
          );
          return of(null);
        }
      });
      this.saving_tags = true;
      forkJoin(promises).subscribe((response) => {
        this.saving_tags = false;
        this.pop.hide();
        const everythingButTheNulls = response.filter((response) => response);
        if (everythingButTheNulls.length) {
          this.toaster.success(
            `${this.titleCase.transform(this.tagLabel)}s successfully added!`
          );
        }
        this.new_tag_params.list = [];
      });
    }
  }

  initiateTagAddition() {
    this.new_tag_params = {};
    this.new_tag_params.list = [];
    this.pop.show();
  }

  onHidden() {
    this.showError = false;
    this.new_tag_params.list = [];
  }

  onCancel() {
    this.showError = false;
    this.pop.hide();
  }
}
