class ManagerCustomFieldsController extends ModalController
    @register 'ManagerCustomFieldsController'

    @inject 'Restangular', 'Utils', 'toaster', '$state', '$timeout', 'SweetAlert','entityId','entityType','entityTypeId','customFields','customUrl'

    initialize: ->
        @fields = []
        @customFields = @customFields.filter((field)=>
          !field.is_linked
        )
        @current_user = @Utils.getCurrentUser()

    linkHasValue: (field)=>
        fieldsWithValue = _(field).filter (item)=>
            item.value_url
        fieldsWithValue.length > 0

    fieldHasValue: (field)=>
        fieldsWithValue = _(field).filter (item)=>
            item.value
        fieldsWithValue.length > 0

    saveCustomFields: =>
        @fieldselectionForm.$setSubmitted true
        if @fieldselectionForm.$valid
            @saving = true
            params =
                'entity_id': Number(@entityId)
                'owner_user_id': @current_user.id
                'entity_type': @entityTypeId
                'schema_type': @entityType.toLowerCase()
                'custom_fields': []
            cFields = angular.copy @customFields
            for selectedField in cFields
                switch selectedField.type
                    when 'link'
                        if @linkHasValue(selectedField.value)
                            params.custom_fields.push selectedField
                        else
                            selectedField.value = []
                            params.custom_fields.push selectedField
                    when "checkbox"
                        if @fieldHasValue(selectedField.value)
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
                    when "dynamic"
                        delete selectedField.dynamicSource
                        if selectedField.has_multiple
                            if @fieldHasValue(selectedField.value)
                                params.custom_fields.push selectedField
                            else
                                selectedField.value = []
                                params.custom_fields.push selectedField
                        else
                            if selectedField.value and selectedField.value.id
                                field = angular.copy selectedField
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
                    else
                        if selectedField.value.length > 0
                            values = []
                            _(selectedField.value).each (field)=>
                                if field.value
                                    values.push field
                            selectedField.value = values
                            params.custom_fields.push selectedField
            if params.custom_fields.length > 0
                @Restangular.all('service/dvapi_service/post_custom_fields_data').post(params).then (response) =>
                    @saving = false
                    @close(response)
                ,(error)=>
                    @saving = false
            else
                @cancel()
