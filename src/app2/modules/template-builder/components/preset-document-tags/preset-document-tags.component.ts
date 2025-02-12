import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Store } from '@ngxs/store';

@Component({
  selector: 'preset-document-tags',
  templateUrl: './preset-document-tags.component.html',
  styleUrls: ['./preset-document-tags.component.css'],
})
export class PresetDocumentTagsComponent implements OnInit {
  @Input() existingTags: any[];
  @Input() editMode: boolean = false;
  @Output() onChange: EventEmitter<any> = new EventEmitter();
  documentsForm: FormGroup;
  loading: boolean = true;
  tags: any[];
  onInitCalled: boolean;
  constructor(private readonly store: Store) {}

  ngOnInit(): void {
    this.documentsForm = new FormGroup({
      tags: new FormControl([]),
    });
    this.onInitCalled = true;
    this.getDocumentTags();
  }

  ngOnChanges(change: SimpleChanges) {
    if (change?.existingTags?.currentValue && this.onInitCalled) {
      this.setExistingTags();
    }
  }

  getDocumentTags() {
    const documentTags = this.store.selectSnapshot(
      (state) => state.user.documentTags
    );
    this.tags = documentTags.map((tag) => {
      return {
        id: tag.id,
        name: tag.name,
      };
    });
    if (this.existingTags?.length) {
      this.setExistingTags();
    }
    this.loading = false;
  }

  setExistingTags() {
    const data = [...this.existingTags];
    this.documentsForm.get('tags').patchValue(data);
    this.handleTagChange(data);
  }

  handleTagChange(tags) {
    this.onChange.emit(tags);
  }
}
