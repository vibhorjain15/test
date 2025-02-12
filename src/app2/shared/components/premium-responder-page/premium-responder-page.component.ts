import { Component, OnDestroy, OnInit } from '@angular/core';
import * as premiumConstant from './premium-constant';
import { RouterService } from 'src/app2/services/router.service';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'premium-responder-page',
  templateUrl: './premium-responder-page.component.html',
  styleUrls: ['./premium-responder-page.component.css'],
})
export class PremiumResponderPageComponent implements OnInit, OnDestroy {
  premiumConstant = premiumConstant;
  buttonTopLoader = false;
  buttonBottomLoader = false;
  veryTopButtonLoader = false;
  testimonialPage = [];
  transition = 0; // Initially we set this to
  currentPage = 0;
  constructor(
    private router: RouterService,
    private http: HttpClient,
    private toaster: ToastrService
  ) {}

  ngOnInit(): void {
    // code to check number of testimonial page as we show 3 per page
    this.testimonialPage = Array(
      Math.ceil(premiumConstant.quotations.length / 3)
    ).fill(1);

    // Remove application wide padding and margins for full page view experience
    document
      .getElementById('page-container-wrapper')
      .classList.remove('content-main');

    document
      .getElementById('page-container')
      .classList.remove('container-fluid');

    document.getElementById('main-body').classList.add('remove-padding');
  }

  goBack() {
    this.router.navigate('app.home');
  }

  makeRequest(type: 'top' | 'bottom' | 'vtop') {
    if (
      this.buttonBottomLoader ||
      this.buttonTopLoader ||
      this.veryTopButtonLoader
    )
      return;

    if (type === 'top') this.buttonTopLoader = true;
    else if (type === 'bottom') this.buttonBottomLoader = true;
    else this.veryTopButtonLoader = true;
    this.http
      .post('feedback', {
        FTypeID: 2004,
        FeedbackText: 'I’d like to schedule a demo',
      })
      .pipe(
        finalize(() => {
          this.buttonTopLoader = false;
          this.buttonBottomLoader = false;
          this.veryTopButtonLoader = false;
        })
      )
      .subscribe((res) => {
        this.toaster.success(
          'Thank you for your interest. Our team will connect with you shortly'
        );
      });
  }

  handleNav(type: 'right' | 'left') {
    if (this.currentPage === 0 && type === 'left') return;
    if (
      this.currentPage ===
        Math.ceil(premiumConstant.quotations.length / 3) - 1 &&
      type === 'right'
    )
      return;

    if (type === 'left') {
      this.transition += 1175;
      this.currentPage--;
    } else {
      this.transition -= 1175;
      this.currentPage++;
    }
  }

  handleScroll(el: HTMLElement) {
    el.scrollIntoView({ behavior: 'smooth' });
  }

  ngOnDestroy(): void {
    // Add back all application wide padding and margins to restore application view
    document
      .getElementById('page-container-wrapper')
      .classList.add('content-main');

    document.getElementById('page-container').classList.add('container-fluid');
    document.getElementById('main-body').classList.remove('remove-padding');
  }
}
