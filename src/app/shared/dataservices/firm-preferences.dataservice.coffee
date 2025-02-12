angular.module('diligenceVault').factory 'FirmPreferenceDataService', (Restangular,Upload,baseUrl) ->
  new class FirmPreferenceDataService

    getFirmPreferences: () ->
      Restangular.all('firm_preferences').customGET()

    updateFirmPreferences: (firmPreferences) ->
      Restangular.all('firm_preferences').customPUT(firmPreferences)

    getFontTypes: () ->
      Restangular.all('font_types').customGET()
      
    getFontSizes: () ->
      Restangular.all('font_sizes').customGET()    

    updateAttachment: (files, fields, id) ->
      params =
        method: 'PUT'
        url: baseUrl + "/DocumentExportTemplates/#{id}"
        file: files

      if fields?
        params.fields = fields

      Upload.upload params
