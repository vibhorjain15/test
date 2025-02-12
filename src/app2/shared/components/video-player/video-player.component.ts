import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.css']
})
export class VideoPlayerComponent implements OnInit, AfterViewInit {
  @Input() videoSrc: string;
  @Input() videoType: string = 'video/mp4';
  
  @ViewChild('video') video: ElementRef<HTMLVideoElement>;
  videoElement: HTMLVideoElement;
  observer: IntersectionObserver;
  isEmbeddedVideo: boolean = false;

  ngOnInit(): void {
    this.isEmbeddedVideo = this.videoSrc.includes('<iframe');
  }

  ngAfterViewInit(): void {
    if (!this.isEmbeddedVideo) {
      this.videoElement = this.video?.nativeElement;
      this.attachVideoInFramObserver();
    }
  }

  attachVideoInFramObserver(): void {
    if (!!this.videoElement) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!this.videoElement.paused) {
            this.pauseVideo();
          }
        });
      }, {
        threshold: 0.5
      });
  
      this.observer.observe(this.videoElement);
    }
  }

  pauseVideo(): void {
    this.videoElement.pause();
  }
}
