import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { QuestionAttributeType } from '../../types/questions.type';
import { TodoModel, TodoType } from '../../types/todo.type';
import { GetQuestionCount } from '../../store/questionnaire.action';
import { UtilsService } from 'src/app2/services/utils.service';
import { CurrentUserModel } from 'src/app2/store/user/user.model';

@Component({
  selector: 'todos',
  templateUrl: './todos.component.html',
  styleUrls: ['./todos.component.css'],
})
export class TodosComponent implements OnInit, AfterViewInit {
  @Input() question: QuestionAttributeType;
  @Input() isReadOnly: boolean = false;
  @Input() onSuccess;
  currentUser: CurrentUserModel;
  loading: boolean = false;
  buttonLoader: boolean = false;
  tinyMceInit = {
    placeholder: 'Enter a to-do item',
    toolbar: false,
    contextmenu: false,
    height: 200,
  };
  todoItem: string = '';
  todoItems: TodoModel[] = [];
  @ViewChild('area') textArea: ElementRef;

  constructor(
    readonly panel: SidePanelService,
    private readonly questionnaire: QuestionnaireService,
    private readonly toaster: ToastrService,
    private readonly store: Store,
    private readonly util: UtilsService
  ) {}
  ngOnInit(): void {
    this.loading = true;
    this.questionnaire
      .getTodos(this.question.answer.id)
      .subscribe((data: TodoType[]) => {
        this.todoItems = (data as TodoModel[])
          .filter((todo) => todo.is_active)
          .sort((item1, item2) => {
            if (item1.is_complete != item2.is_complete) {
              return item1.is_complete ? 1 : -1;
            }

            if (item1.created_at && item2.created_at) {
              return new Date(item1.created_at) > new Date(item2.created_at)
                ? 1
                : -1;
            }

            return 0;
          });
        this.loading = false;
      });

    this.currentUser = this.util.getCurrentUser();
  }

  ngAfterViewInit(): void {
    this.textArea.nativeElement.focus({
      preventScroll: true,
    });
  }

  handleTodoItemChange(todo) {
    todo = todo.trim();
    if (todo.length) this.todoItem = todo;
    else this.todoItem = '';
  }
  onCancel() {
    this.panel.close();
  }

  addTodoItem(close) {
    this.buttonLoader = true;
    this.questionnaire
      .createTodo({
        entity_id: this.question.answer.id,
        entity_type: 'Response',
        text: this.todoItem,
      })
      .subscribe(
        (data: TodoType) => {
          this.todoItems.unshift(data as TodoModel);
          this.onSuccess(
            this.todoItems.filter((val) => !val.is_complete).length
          );
          this.todoItem = '';
          this.store.dispatch(new GetQuestionCount());
          this.buttonLoader = false;
        },
        (e) => {
          this.buttonLoader = false;
        }
      );
  }

  handleDelete(todo: TodoModel) {
    todo.loading = true;
    this.questionnaire.deleteTodo(todo.id).subscribe(() => {
      todo.is_active = false;
      todo.loading = false;
      this.todoItems = this.todoItems.filter((todo) => todo.is_active);
      this.toaster.success('', 'Todo has been deleted!');
      this.store.dispatch(new GetQuestionCount());
    });
  }

  markTodoAsDone(todo: TodoModel) {
    let todo_copy = { ...todo };
    delete todo_copy.loading;
    todo.loading = true;
    this.questionnaire
      .updateTodo({ ...todo_copy, is_complete: true })
      .subscribe(() => {
        todo.completed_by_name = this.currentUser.fullName;
        todo.completed_at = new Date();
        todo.is_complete = true;
        todo.loading = false;
        this.todoItems = JSON.parse(JSON.stringify(this.todoItems));
        this.onSuccess(this.todoItems.filter((val) => !val.is_complete).length);
        this.toaster.success('', 'Todo has been marked as completed!');
        this.store.dispatch(new GetQuestionCount());
      });
  }
}
