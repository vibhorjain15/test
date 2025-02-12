type ServiceRequriedType =
  | 'type'
  | 'visible'
  | 'alias'
  | 'sub_type'
  | 'status'
  | 'is_mandatory'
  | 'has_href';

type UserRequiredType = 'alias' | 'is_mandatory';

type Option = {
  id: number;
  value: string;
};

type Value = {
  value: string;
};

export type TagsType = {
  type: string;
  has_multiple: boolean;
  has_href: boolean;
  sub_type?: string;
  endpoint?: string;
  is_mandatory: boolean;
  order: number;
  status: boolean;
  visible: number;
  alias: string;
  value?: Value[];
  options?: Option[];
  display_attribute?: string;
  field_unique_key: string;
  user_required?: UserRequiredType;
  service_required?: ServiceRequriedType[];
  description?: string;
  href?: string;
  questions?: number[];
  category_group_id: number;
  template_id?: number;
  display_format: any;
};
