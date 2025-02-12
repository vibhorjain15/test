import { FileLoader, FileRepository, Plugin } from 'ckeditor5';
import {
  UploadAdapter,
  UploadResponse,
} from '@ckeditor/ckeditor5-upload/src/filerepository';

export default class DVImageUploadPlugin extends Plugin {
  public static get requires() {
    return [FileRepository] as const;
  }

  public static get pluginName() {
    return 'DVImageUploadPlugin' as const;
  }

  init(): void {
    const editor = this.editor;
    const adapterCallback = editor.config.get('dvUpload.adapterCallback');
    const fileRepository = editor.plugins.get(FileRepository);

    fileRepository.createUploadAdapter = (loader) => {
      return new DVImageUploadAdapter(loader, adapterCallback);
    };
  }
}

class DVImageUploadAdapter implements UploadAdapter {
  private readonly _loader: FileLoader; // The file loader instance.
  private readonly _adapterCallback: (file: File) => Promise<Object>;

  constructor(
    loader: FileLoader,
    adapterCallback: (file: File) => Promise<Object>
  ) {
    this._loader = loader;
    this._adapterCallback = adapterCallback;
  }

  async upload(): Promise<UploadResponse> {
    const file = await this._loader.file;
    if (!file) {
      return;
    }

    return new Promise<UploadResponse>(async (resolve, reject) => {
      const genericErrorText = `Couldn't upload file: ${file.name}`;
      const response = await this._adapterCallback(file).catch((error) => {
        reject(genericErrorText);
      });

      resolve({
        default: response[0].blobUrl,
      });
    });
  }
}
