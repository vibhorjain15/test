angular.module('diligenceVault').factory 'QuestionnaireWidgetFactory', ($templateCache, Utils) ->
  new class QuestionnaireWidgetFactory
    templateUrlBase = "diligence/project/questionnaire/new_directives/questionnaireWidgets"

    getWidgetTemplate: (responseType, readonly, preview, analytics_mode, is_NA, print_preview, trackchangesmode) ->
      if is_NA
        templateName = 'is_NA'

      else
        responseType = responseType.toLowerCase()

        if analytics_mode
          return @getAnalyticsTemplate(responseType)

        if readonly
          switch responseType
            when 'returntable', 'aumtable', 'textmultiline', 'attachment', 'grid', 'dynamicgrid'
              templateName = "#{responseType}-readonly"
            when 'booleanplus', 'noplus'
              templateName = 'booleanplus-readonly'
            when 'checkbox'
              templateName = 'checkbox-readonly'
            when 'text', 'textemail'
              templateName = 'text-readonly'
            else
              templateName = 'readonly'
        else
          if responseType is 'textmultiline' and (print_preview or !Utils.allowRichTextarea())
            if print_preview
              templateName = 'textmultiline-plain-non-e'
            else if !Utils.allowRichTextarea()
              templateName = 'textmultiline-plain'
          else if responseType is 'attachment' and (preview or print_preview)
            if print_preview
              templateName = 'attachment-readonly'
            else
              templateName = 'attachment-preview'
          else if responseType is 'returntable' and (preview or print_preview)
            templateName = 'returntable-preview'
          else if responseType is 'aumtable' and (preview or print_preview)
            templateName = 'aumtable-preview'
          else
            templateName = responseType

        if (responseType is 'grid' or responseType is 'dynamicgrid') and (print_preview)
          templateName = 'grid-print-preview'
          
        if responseType is 'checkbox' and readonly and print_preview
          templateName = 'readonly'

        if trackchangesmode
          if responseType in ['grid','dynamicgrid']
            templateName = 'response-grid-track-changes'
          else if responseType not in ['grid','dynamicgrid','returntable', 'aumtable', 'attachment','textmultiline']
            templateName = 'response-track-changes'
        
      templateUrl = "#{templateUrlBase}/#{templateName}.html"

      $templateCache.get(templateUrl)

    getAnalyticsTemplate: (responseType) ->
      switch responseType
        when 'text', 'textmultiline', 'textemail', 'textphone'
          templateName = 'text-response-analysis'
        else
          templateName = 'response-analysis'

      templateUrl = "#{templateUrlBase}/#{templateName}.html"

      $templateCache.get(templateUrl)
