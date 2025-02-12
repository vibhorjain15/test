import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Subject } from 'rxjs';
import { DesignPrefImageResponse } from './ImageData.type';

@Injectable({
  providedIn: 'root',
})
export class ImageDataService {
  uploadedImageResSub: Subject<DesignPrefImageResponse>;

  constructor(private readonly http: HttpClient) {
    this.uploadedImageResSub = new Subject();
  }

  uploadImage(payload) {
    return this.http.post('images', payload, {
      reportProgress: true,
      observe: 'events',
    });
  }
  uploadImageDirect(payload) {
    return this.http.post('images', payload);
  }

  getImages() {
    return this.http.get(`images`);
  }

  processImage(image) {
    image.insertTimeStamp = new Date(image.insertTimeStamp);
    return image;
  }

  deleteImage(id) {
    return this.http.delete('images/' + id);
  }

  /**
   * Replaces the base64 images with image URL.
   * @param responseText The response text.
   * @returns The response text without any base64 images content.
   */
  async asyncReplaceBase64Images(responseText: string): Promise<string> {
    if (!responseText) {
      return Promise.resolve(responseText);
    }

    const base64ImageRegex = /src="(data:image.*?)"/g;
    const replacePlaceholderTokenRegex = /\{\{(.*?)\}\}/g;
    const base64Images: { [key: string]: string } = {};

    // replacing src="data:image/png;base64,iVBOR...==" with src="{{imgSrc-${id}}}", and
    // extracting all the base64 images data in `base64Images` dictionary.
    responseText = responseText.replace(
      base64ImageRegex,
      (match: string, token: string) => {
        const key = `imgSrc-${crypto.randomUUID()}`;
        base64Images[key] = token;
        return `src="{{${key}}}"`; // replace this key with blob image url, once it is uploaded to server
      }
    );

    if (!base64Images || Object.keys(base64Images).length === 0) {
      return Promise.resolve(responseText); // Returning the same response. Since, there are no base64 images present.
    }

    const apiCallsToUploadImages: { [key: string]: any } = {};
    for (const key of Object.keys(base64Images)) {
      const blob = await (await fetch(base64Images[key])).blob();
      const payload = new FormData();
      payload.append('file', blob, `${new Date().getTime()}.png`);
      apiCallsToUploadImages[key] = this.uploadImageDirect(payload);
    }

    return new Promise<string>((resolve, reject) => {
      forkJoin(apiCallsToUploadImages).subscribe(
        (response: { [keys: string]: any }) => {
          responseText = responseText.replace(
            replacePlaceholderTokenRegex,
            (match: string, token: string) => {
              // Here, token will be the enclosed part within parentheses
              // of `replacePlaceholderTokenRegex` which is `(.*?)`.
              // For example: if match is `{{imgSrc-1}}`, then token will be `imgSrc-1`
              if (token in response) {
                return response[token][0].blobUrl;
              }

              return match;
            }
          );

          resolve(responseText);
        }
      );
    });
  }
}
