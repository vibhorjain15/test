export type CarouselType = 'image' | 'video';

export interface CarouselDetail {
  src: string;
  alt?: string;
  type: CarouselType;
}
