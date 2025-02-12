import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { UserService } from 'src/app2/services/user.service';
import { ClipboardService } from 'ngx-clipboard';

@Component({
  selector: 'app-my-token',
  templateUrl: './my-token.component.html',
  styleUrls: ['./my-token.component.css'],
})
export class MyTokenComponent implements OnInit {
  token: string;
  constructor(
    private readonly toaster: ToastrService,
    private readonly UserService: UserService,
    private readonly clipboardService: ClipboardService
  ) {}

  ngOnInit(): void {
    this.UserService.getCurrentUserProfile().subscribe(() => {
      // calling API as to avoid copying the expired token as API call will update the token in LocalStorage if expired.
      this.token = localStorage.getItem('jwt');
    });
  }

  copySuccess() {
    this.clipboardService.copy(this.token);
    this.toaster.success('token copied successfully');
  }
}
