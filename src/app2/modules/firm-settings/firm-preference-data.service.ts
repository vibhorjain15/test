import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FirmPreferenceDataService {
  constructor(private readonly http: HttpClient) {}
  getFirmPreferences() {
    return this.http.get(`firm_preferences`);
  }

  updateFirmPreferences(firmPreferences: any) {
    return this.http.put(`firm_preferences`, firmPreferences);
  }

  getFontTypes() {
    return this.http.get(`font_types`);
  }

  getFontSizes() {
    return this.http.get(`font_sizes`);
  }

  updateAttachment(files: any, fields: any, id: any) {
    const params: any = {
      method: 'PUT',
      url: `DocumentExportTemplates/${id}`,
      file: files,
    };
    if (fields != null) {
      params.fields = fields;
    }
    // TODO: Inject Upload (Not used in Angular currently/ will add later)
    // return Upload.upload(params);
  }
}
