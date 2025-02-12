import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FileHandlerService {
  file_handlers: {};
  MAX_FILE_SIZE: number;
  MAX_FILENAME_CHARACTERS: number;
  META_CHARACTER_REGEX: RegExp;
  FIRST_CHARACTER_REGEX: RegExp;

  constructor() {
    this.file_handlers = {};
    this.MAX_FILE_SIZE = 50;
    this.MAX_FILENAME_CHARACTERS = 255;
    this.META_CHARACTER_REGEX =
      /^(?!^(PRN|AUX|CLOCK\$|NUL|CON|COM\d|LPT\d|\..*)(\..+)?$)[^\x00-\x1f\\?*:\";|/]+$/i;
    this.FIRST_CHARACTER_REGEX = /^[^\=\+\-\@\s]/;
  }

  add(name: string | number, file_handler: any) {
    this.file_handlers[name] = file_handler;
  }

  remove(name: string | number) {
    delete this.file_handlers[name];
  }

  get(name: string | number) {
    return this.file_handlers[name];
  }

  getMaxFileSize() {
    return this.MAX_FILE_SIZE;
  }

  getFilenameRegex() {
    return this.META_CHARACTER_REGEX;
  }

  getFirstCharacterRegex() {
    return this.FIRST_CHARACTER_REGEX;
  }

  getFilenameCharacterLimit() {
    return this.MAX_FILENAME_CHARACTERS;
  }

  getFileTypes() {
    const list = [
      '.pdf',
      '.doc',
      '.docx',
      '.jpg',
      '.png',
      '.jpeg',
      '.xls',
      '.xlsm',
      '.xlsx',
      '.odt',
      '.csv',
      '.vsd',
      '.vsdx',
      '.pptx',
      '.ppt',
      '.pps',
      '.ppsx',
      '.key',
      '.msg',
      '.eml',
      '.zip',
      '.rar',
      '.txt',
    ];
    return list;
  }
}
