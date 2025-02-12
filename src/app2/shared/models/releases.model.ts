import { ICellRendererParams } from 'ag-grid-community';

import { CarouselDetail } from './carousel.model';

export interface IReleaseDetail {
  id?: number;
  release_date: Date;
  title: string;
  image_urls: Array<string>;
  description: string;
  faq_url?: string;
  video_url?: string;
  storylane_url?: string;
  is_draft: boolean;
  user_type: string;
  category: string;
  read: boolean;
  created_by_name: string;
}

export class ReleaseDetail implements IReleaseDetail {
  id?: number;
  release_date: Date;
  title: string;
  image_urls: Array<string>;
  description: string;
  faq_url?: string;
  video_url?: string;
  storylane_url?: string;
  is_draft: boolean;
  user_type: string;
  category: string;
  read: boolean;
  created_by_name: string;

  constructor(args: IReleaseDetail) {
    this.id = args.id;
    this.release_date = args.release_date;
    this.title = args.title;
    this.image_urls = args.image_urls;
    this.description = args.description;
    this.faq_url = args.faq_url;
    this.video_url = args.video_url;
    this.storylane_url = args.storylane_url;
    this.is_draft = args.is_draft;
    this.user_type = args.user_type;
    this.category = args.category;
    this.read = args.read;
    this.created_by_name = args.created_by_name;
  }

  get canShowCarousel(): boolean {
    return (
      (this.image_urls !== undefined && this.image_urls.length > 0) ||
      this.video_url !== undefined
    );
  }

  get carouselDetails(): Array<CarouselDetail> {
    const details: Array<CarouselDetail> = [];
    if (this.image_urls && this.image_urls.length) {
      details.push(
        ...this.image_urls.map<CarouselDetail>((url) => ({
          src: url,
          type: 'image',
        }))
      );
    }

    if (this.video_url) {
      details.push({
        src: this.video_url,
        type: 'video',
      });
    }

    return details;
  }
}

/**
 * Release note details action cell renderer params.
 * @extends ICellRendererParams
 */
export interface IReleaseDetailActionCellRendererParams
  extends ICellRendererParams {
  clickedMarkAsFinal(data: IReleaseDetail): void;
  clickedEdit(field: IReleaseDetail): void;
  clickedDelete(field: IReleaseDetail): void;
}
