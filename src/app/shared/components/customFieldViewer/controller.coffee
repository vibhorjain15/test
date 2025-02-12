class CustomFieldViewerController extends BaseController
    @register 'CustomFieldViewerController'

    @inject '$attrs', '$scope', 'Restangular','$timeout', '$injector','Utils','$q','ModalFactory','SweetAlert'

    initialize: ->
        @is_admin = @Utils.isAdmin()
        @entity_type_name = @Utils.getDisplayEntityType(@entityType)
        @$scope.$watchGroup ['vm.entityId','vm.entityType'],(value)=>
            @loadCustomFields()

    loadCustomFields: ->
        @loading_data = true
        params = {}
        params.schema_type = @entityType
        params.entity_id = if @entityId then @entityId else 0
        @Restangular.all('service/dvapi_service/get_custom_fields').post(params).then ((response) =>
            @custom_fields = response.custom_fields[@entityType]
            @schema_format = response.schema_format
            @loading_data = false
        ),(error) =>
            @loading_data = false

    displayFieldRemovalConfirmation: (entry, index) ->
        @SweetAlert.confirm({
            title: "Are you sure you want to remove the custom field for #{@entity_type_name.toLowerCase()} tags?"
            confirmButtonText: 'Yes'
            focusCancel: true
            showLoaderOnConfirm: true
        preConfirm: =>
            @removeCustomField(entry, index)
        })

    removeCustomField: (entry, index)->
        entry.status = false
        params =
            entity_type : if @entityTypeId then @entityTypeId else 0
            custom_fields : [entry]
            schema_type : @entityType
            entity_id : if @entityId then @entityId else 0
        @Restangular.all('service/dvapi_service/update_custom_fields').post(params).then ((response) =>
            @custom_fields.splice(index,1)
            swal.close()
        ), (error) =>
            swal.close()

    addNewCustomTags: =>
        @ModalFactory.invokeModal 'add_custom_tags',
            resolve:
                type: => @entityType
                typeId: => @entityTypeId
                entityId: => @entityId
                existing_tags: => angular.copy @custom_fields
                schema_format: => @schema_format
                source: => @source
            success: (response) =>
                if response
                    @custom_fields = response

    editCustomFields: (index) =>
        @ModalFactory.invokeModal 'add_custom_tags',
            resolve:
                type: => @entityType
                typeId: => @entityTypeId
                entityId: => @entityId
                editIndex: => index
                existing_tags: => angular.copy @custom_fields
                schema_format: => @schema_format
                source: => @source
            success: (response) =>
                if response
                    @custom_fields = response
