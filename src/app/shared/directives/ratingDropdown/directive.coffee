angular.module('diligenceVault').directive 'ratingDropdown', ($timeout,Restangular,toaster,$state,ModalFactory,Utils,ratingConstants) ->
  restrict: 'E'
  templateUrl: 'shared/directives/ratingDropdown/template.html'
  scope:
    selection: '='
    ratingScales: '<'
    readonly: '='
    reviewEnabled: '<'
    enableTrackChanges: '<'
    responseId: '='
    ratingLevel: '<'
    functions: '<'
    assignedFunctions: '<'
  link: (scope, element) ->
    current_user = Utils.getCurrentUser()
    diligenceTypeId = 1105
    diligenceId = $state.params.diligenceId
    scope.previousRating = angular.copy scope.selection.rating.attributes
    
    scope.recordRating = (rating)=>
        if rating.rating_value
            rating.rating_value = parseInt rating.rating_value
        params=
            value: if (rating.rating_value is 0 || !rating.rating_value) then null else rating.rating_value
            entity_id: diligenceId
            entity_type: 'Duediligence'
            ratingCategoryID: rating.rating_id
            response_id: scope.responseId if scope.responseId

        Restangular.all('ratings').customPUT(params).then =>
            toaster.pop 'success', '', 'Your rating has been recorded successfully'
            scope.rating_color = scope.getRatingColor()
            scope.previousRating = angular.copy rating
            scope.$emit 'refresh:counts'

    scope.getRatingColor = =>
      selectedScale = _(scope.ratingScales).find (scale)=>
        scale.value == scope.selection.rating.attributes.rating_value
      color_code = selectedScale.color_code if selectedScale
      color_code

    scope.loadCustomFields = ->
      Restangular.all('service/dvapi_service/get_custom_fields_data').post({entity_id : Number(diligenceId), entity_type: diligenceTypeId, schema_type: 'rating', sub_entity_id: scope.selection.rating.attributes.rating_id}).then (response) =>
        scope.customFields = response.data
        scope.getCustomFieldsWithValue(scope.customFields)
    
    scope.getRatingTooltip = =>
      selectedScale = _(scope.ratingScales).find (scale)=>
        scale.value == scope.selection.rating.attributes.rating_value
      scaleName = selectedScale.name if selectedScale
      scaleName

    deregisterer = scope.$watch 'ratingScales',(value)=>
      if value
        scope.rating_color = scope.getRatingColor()
        deregisterer()

    scope.getCustomFieldsWithValue = (value)=>
      scope.fieldsWithValue = _(value).filter (field)=>
        if field.type == 'link'
          scope.linkHasValue(field.value)
        else
          scope.fieldHasValue(field.value)

    scope.linkHasValue = (field)=>
      fieldsWithValue = _(field).filter (item)=>
        item.value_url
      fieldsWithValue.length > 0

    fieldHasValue = (field)=>
      fieldsWithValue = _(field).filter (item)=>
        item.value
      fieldsWithValue.length > 0

    scope.loadCustomFields()

    scope.openCustomFieldsModal = (rating, view_mode)=>
      if (scope.customFields and scope.customFields.length > 0) or scope.reviewEnabled
        rating.mode = ratingConstants.Absolute
        ModalFactory.invokeModal 'manage_rating_custom_fields',
          resolve:
            entityType: => diligenceTypeId
            entityId: => Number(diligenceId)
            subEntityId: => rating.attributes.rating_id
            rating: => rating
            readonly: => scope.readonly
            ratingScales: => scope.ratingScales
            enableReview: => scope.reviewEnabled && rating.attributes.rating_value
            enable_tracking: => scope.enableTrackChanges
            functions: => scope.functions
            assignedFunctions: => scope.assignedFunctions
            parentScope: => scope
          success: (response)=>
            scope.rating_color = scope.recordRating(response.rating.attributes) if !view_mode
            scope.saveCustomFields(response.rating.attributes,response.customFields)
          dismiss: (response)=>
            scope.selection.rating.attributes.rating_value = scope.previousRating.rating_value if !view_mode
      else
        scope.recordRating(rating)

    scope.linkHasValue = (field)=>
      fieldsWithValue = _(field).filter (item)=>
        item.value_url
      fieldsWithValue.length > 0

    scope.fieldHasValue = (field)=>
      fieldsWithValue = _(field).filter (item)=>
        item.value
      fieldsWithValue.length > 0

    scope.saveCustomFields = (rating,customFields)=>
      params =
        'entity_id': Number(diligenceId)
        'owner_user_id': current_user.id
        'entity_type': diligenceTypeId
        'schema_type': 'rating'
        'sub_entity_id': rating.rating_id
        'custom_fields': []
      cFields = angular.copy customFields
      for selectedField in cFields
        switch selectedField.type
          when 'link'
            if scope.linkHasValue(selectedField.value)
              params.custom_fields.push selectedField
            else
              selectedField.value = []
              params.custom_fields.push selectedField
          when "checkbox"
            if scope.fieldHasValue(selectedField.value)
              if selectedField.otherOption
                otherOptionIndex = _(selectedField.value).findIndex (item)=>
                  item.id == selectedField.otherOption.id
                if otherOptionIndex > -1
                  otherOption = angular.copy selectedField.value[otherOptionIndex]
                  otherOption.value = selectedField.textExplanation
                  selectedField.value[otherOptionIndex] = otherOption
              params.custom_fields.push selectedField
            else
              selectedField.value = []
              params.custom_fields.push selectedField
          when "dropdown"
            if selectedField.value and selectedField.value.id
              field = angular.copy selectedField
              if field.otherOption and field.value.id == field.otherOption.id
                otherOption = angular.copy field.value
                otherOption.value = field.textExplanation
                field.value = otherOption
              field.value = [field.value]
              params.custom_fields.push field
            else
              selectedField.value = []
              params.custom_fields.push selectedField
          when "numeric", "int"
            if selectedField.value.length > 0
              values = []
              _(selectedField.value).each (field)=>
                if !_(parseFloat(field.value)).isNaN()
                  field.value = Number(field.value)
                  values.push field
              selectedField.value = values
              params.custom_fields.push selectedField
          when "textmultiline"
            if selectedField.value.length > 0
              values = []
              _(selectedField.value).each (field)=>
                if field.value
                  field.value = Utils.trimLineBreak(field.value)
                  values.push field
              selectedField.value = values
              params.custom_fields.push selectedField
          else
            if selectedField.value.length > 0
              values = []
              _(selectedField.value).each (field)=>
                if field.value
                  field.value = field.value.trim()
                  values.push field
              selectedField.value = values
              params.custom_fields.push selectedField

      
      if params.custom_fields.length > 0
        Restangular.all('service/dvapi_service/post_custom_fields_data').post(params).then (response) =>
          toaster.pop 'success','','Custom fields saved successfully'
          scope.customFields = response.data
          scope.getCustomFieldsWithValue(response.data)