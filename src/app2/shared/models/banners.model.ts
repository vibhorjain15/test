import { ICellRendererParams } from 'ag-grid-community';

export interface IBannerDetail {
  id?: number;
  banner_title: string;
  banner_url: string;
  background_color: string;
  button_label: string;
  button_color: string;
  button_label_color: string;
  button_asset_url: string;
  redirect_url: string;
  is_draft: boolean;
  probability: number;
}

export class BannerDetail implements IBannerDetail {
  id?: number;
  banner_title: string;
  banner_url: string;
  background_color: string;
  button_label: string;
  button_color: string;
  button_label_color: string;
  button_asset_url: string;
  redirect_url: string;
  is_draft: boolean;
  probability: number;

  constructor(args: IBannerDetail) {
    this.id = args.id;
    this.banner_title = args.banner_title;
    this.banner_url = args.banner_url;
    this.background_color = args.background_color;
    this.button_label = args.button_label;
    this.button_color = args.button_color;
    this.button_label_color = args.button_label_color;
    this.button_asset_url = args.button_asset_url;
    this.redirect_url = args.redirect_url;
    this.is_draft = args.is_draft;
    this.probability = args.probability;
  }
}

/**
 * Banner details action cell renderer params.
 * @extends ICellRendererParams
 */
export interface IBannerDetailActionCellRendererParams
  extends ICellRendererParams {
  clickedMarkAsFinal(data: IBannerDetail): void;
  clickedEdit(field: IBannerDetail): void;
  clickedDelete(field: IBannerDetail): void;
}
