class DVCustomFieldsController extends BaseController
    @register 'DVCustomFieldsController'

    @inject '$attrs', '$scope', 'Restangular','$timeout', '$injector','Utils','$q'

    initialize: ->
        @loading_data = true
        @$scope.$watch "vm.customFields", (value)=>
            if value
                @fields = _(value).filter (field)=>
                    if field.type == 'link'
                        @linkHasValue(field.value)
                    else if field.type == 'int' or field.type == 'numeric'
                        @numberHasValue(field.value)
                    else
                        @fieldHasValue(field.value)
                @loading_data = false

    linkHasValue: (field)=>
        if field
            fieldsWithValue = _(field).filter (item)=>
                item.value_url
            fieldsWithValue.length > 0

    fieldHasValue: (field)=>
        if field
            fieldsWithValue = _(field).filter (item)=>
                item.value
            fieldsWithValue.length > 0

    numberHasValue: (field)=>
        if field
            fieldsWithValue = _(field).filter (item)=>
                _(item.value).isNumber()
            fieldsWithValue.length > 0
