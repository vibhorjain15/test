import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { FormControl } from '@angular/forms';
import { finalize, take, tap } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { Select, Store } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import {
  GetDocumentTags,
} from 'src/app2/store/user/user.action';

@Component({
  selector: 'app-document-types',
  templateUrl: './document-types.component.html',
  styleUrls: ['./document-types.component.css'],
})
export class DocumentTypesComponent implements OnInit, OnDestroy {
  loading_tags: boolean = true;
  system_tags = [];
  custom_tags = [];
  is_admin;
  new_tag_params;
  isPopoverOpen: boolean;
  tags = [];
  showError = false;
  saving_tags: boolean;
  @ViewChild('pop') pop;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getDocumentTags) documentTags;
  minLength(control: FormControl) {
    if (control.value?.trim().length < 2) {
      return {
        minLength: true,
      };
    }
    return null;
  }
  pattern(control: FormControl) {
    let regex = new RegExp('^[^+@=\\-]|^$');
    if (!regex.test(control.value)) {
      return {
        pattern: true,
      };
    }
    return null;
  }
  validators = [this.minLength, this.pattern];
  errorMessages = {
    minLength: 'Minimum 2 characters',
    pattern: 'Cannot start with a special character',
  };

  constructor(
    private readonly http: HttpClient,
    private readonly SweetAlert: SweetAlertService,
    private readonly toaster: ToastrService,
    private readonly store: Store
  ) {}

  ngOnInit(): void {
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.is_admin = data.isAdmin;
          this.loadTags();
        }
      });

    this.new_tag_params = {};
    this.new_tag_params.list = [];
    this.isPopoverOpen = false;
  }

  loadTags() {
    this.documentTags
      .pipe(
        take(2),
        tap((tagsData: any) => {
          if (!tagsData) {
            this.store.dispatch(new GetDocumentTags());
          }
        })
      )
      .subscribe(
        (response) => {
          if (response) {
            this.tags = [...response];
            this.groupTags();
            this.loading_tags = false;
          }
        },
        (e) => (this.loading_tags = false)
      );
  }

  groupTags() {
    this.tags.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });
    this.system_tags = [];
    this.custom_tags = [];
    this.tags.forEach((tag) => {
      if (tag.firm_id) {
        this.custom_tags.push(tag);
      } else {
        this.system_tags.push(tag);
      }
    });
  }

  displayTagRemovalConfirmation(tag) {
    this.SweetAlert.confirm({
      title: `Are you sure you want to remove \"${tag.name}\"? Existing assignments will be deleted.`,
      type: 'warning',
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
      .delete(`document_tag_definitions/${tag.id}`)
      .pipe(finalize(() => resolve()))
      .subscribe(() => {
        this.toaster.success('Tag deleted successfully!');
        this.tags.splice(this.tags.indexOf(tag), 1);
        this.groupTags();
      });
  }

  initiateTagAddition() {
    this.new_tag_params.list = [];
    this.isPopoverOpen = true;
  }

  handleTagsInput(data) {
    data.forEach((val) => {
      let replaced = val.value.replace(/\s/g, ' ');
      val.value = replaced;
      val.display = replaced;
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
        const tag_exists = this.tags.some(
          (tag_item) => tag_item.name.toLowerCase() === tag.toLowerCase()
        );
        if (!tag_exists) {
          const promise = this.http
            .post('document_tag_definitions', {
              name: tag,
            })
            .pipe(
              tap((response: any) => {
                this.tags.push(response);
                this.groupTags();
              })
            );
          return promise;
        } else {
          this.toaster.info(`Tag ${tag} already exists!`);
          return null;
        }
      });
      let fork = [];
      promises.map((val) => {
        if (val != null) fork.push(val);
      });
      if (fork.length === 0) return;
      this.saving_tags = true;
      forkJoin(fork)
        .pipe(finalize(() => (this.saving_tags = false)))
        .subscribe((response) => {
          this.pop.hide();
          const everythingButTheNulls = response.filter((response) => response);
          if (everythingButTheNulls.length) {
            this.toaster.success('Tags successfully added!');
          }
          this.new_tag_params.list = [];
        });
    }
  }

  onHidden() {
    this.showError = false;
    this.new_tag_params.list = [];
  }

  onCancel() {
    this.showError = false;
    this.pop.hide();
  }

  ngOnDestroy(): void {
    // save updated data in store for other pages
    this.store.dispatch(new GetDocumentTags());
  }
}

