export interface DVUploadConfig {
  callback?(): void;
  adapterCallback?(file: File): Promise<Object>;
}
