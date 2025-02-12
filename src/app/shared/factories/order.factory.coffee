angular.module('diligenceVault').factory 'OrderService', ($state,ERROR_CODES,SweetAlert,toaster, $rootScope) ->
  new class OrderService
    performOrdering: (options) ->
      items = options.items
      ui = options.ui
      order_attribute = options.order_attribute
      resource = options.resource
      $el = options.$el

      src_index = ui.item.sortable.index
      dest_index = ui.item.index()
      item = ui.item.sortable.model
      item_replaced_with = items[dest_index]

      getOrder = (item) -> item[order_attribute]
      setOrder = (item, value) -> item[order_attribute] = value

      if dest_index is 0
        order = getOrder(items[0]) / 2
      else if dest_index is items.length - 1
        order = getOrder(items[items.length - 1]) + 1024
      else
        order = (getOrder(items[dest_index - 1]) + getOrder(items[dest_index])) / 2


      #this directive is being used at many places so making sure it doesn't affect at other places
      if resource.route == 'sections'
        params =
        {
          destination_index: dest_index
        }
      else if resource.route == 'questions'
        params = _(item).pick('responseType')
        params.destination_index = dest_index
      else if resource.route == 'workflow_steps'
        params = _(item).pick('description','id','name','order','workflow_id')
        params.destination_index = dest_index
      else
        params = {}
        setOrder(params,order)

      promise = resource.customPUT(params)

      promise.then (response) ->
        response_order = getOrder(response)
        $rootScope.$emit 'refresh:template'

        setOrder(item, response_order)
        if response_order isnt order
          for item, idx in items[dest_index...]
            if idx isnt items.length - 1
              item_order = getOrder(item)

              if getOrder(items[idx + 1]) - item_order < 1024
                setOrder(item, item_order + 1024)

      promise.then null, (error)=>
        $el?.sortable('cancel')
        if (resource.route == 'sections' || resource.route == 'questions') and error.status == ERROR_CODES.BAD_REQUEST
            SweetAlert.error({
              title: error.data.message
              confirmButtonText: 'Refresh'
            }).then (isConfirm) =>
              if isConfirm.value and isConfirm.value == true
                $state.go("app.diligence.template.preview",{templateId: $state.params.templateId})
          else if error.data and error.data.message != ""
            toaster.pop 'error', '', error.data.message
      promise
