type typeOptionsType = {
  type: string;
};

export type optionsTypes = {
  id: number;
  is_active: boolean;
  text: string;
  type: string;
  type_options: typeOptionsType;
  valid?: boolean;
  containsHtmlTags?: boolean;
};

export type fieldPreviewtype = {
  responseType?: any;
  rows?: any;
  columns?: any;
  options?: optionsTypes[];
  dynamic_element?: any;
  attachmentUploadEnabled?: boolean;
  has_other_option: boolean;
  has_other_option_enabled?: boolean;
  filename?: any;
  attachmentHtml?: any;
  attachmentHref?: any;
  predefined_document_tags: any[];
};
