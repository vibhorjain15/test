import { Component, OnInit } from '@angular/core';
import Cropper from 'cropperjs';
import { ToastrService } from 'ngx-toastr';
import { ImageDataService } from 'src/app2/services/ImageData/ImageDataService.service';

@Component({
  selector: 'update-image',
  templateUrl: './update-image.component.html',
})
export class UpdateImageModal implements OnInit {
  areaType = 'rectangle';
  minAreaSize = 100;
  resultBlob = {};
  imageDataURI: any = null;
  resultImageDataURI = '';
  urlBlob = {};
  isImage: boolean = false;
  imageFormat;
  cropper;
  loading: boolean = false;
  supportedImageExtensions = ['png', 'jpg', 'jpeg'];
  constructor(
    private readonly toaster: ToastrService,
    private readonly ImageDataService: ImageDataService
  ) {}
  ngOnInit() {}

  fileChangeCallback(event) {
    this.isImage = true;
    let file = event.currentTarget.files[0];
    const fi = new FileReader();
    fi.readAsDataURL(file);
    fi.onload = (event) => {
      if (event.target.result !== this.imageDataURI) {
        let imageURI: any = event.target.result;
        this.imageFormat = imageURI.substring(
          imageURI.indexOf('/') + 1,
          imageURI.indexOf(';')
        );
        if (this.supportedImageExtensions.includes(this.imageFormat)) {
          this.imageDataURI = event.target.result;
          this.initCropper('cropImgDesignPref');
          fi.readAsDataURL(file);
        } else {
          this.isImage = false;
          this.toaster.error(
            'Selected file is not supported, please upload a png, jpg or jpeg file.'
          );
        }
      }
    };
  }

  initCropper(id) {
    let img: any = document.getElementById(id);
    img.src = this.imageDataURI;
    this.cropper = new Cropper(img, {
      preview: '.imgPreview',
      minCropBoxWidth: 100,
      minCropBoxHeight: 100,
      autoCropArea: 1,
    });
  }

  save(callback) {
    if (this.cropper) {
      this.loading = true;
      const cropcanvas = this.cropper.getCroppedCanvas();
      cropcanvas.toBlob((blob) => {
        const payload = new FormData();
        payload.append('file', blob, 'Img-' + new Date().getTime() + '.png');
        this.ImageDataService.uploadImageDirect(payload).subscribe(
          (res) => {
            callback();
            this.ImageDataService.uploadedImageResSub.next(res[0]);
            this.loading = false;
          },
          () => {
            this.loading = false;
          }
        );
      });
    } else {
      this.toaster.error('please upload a png, jpg or jpeg file.');
    }
  }
}
