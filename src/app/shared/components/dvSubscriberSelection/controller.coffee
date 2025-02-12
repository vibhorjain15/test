class SubscriberSelectionController extends BaseController
    @register 'SubscriberSelectionController'

    @inject '$attrs', '$scope', 'Restangular', 'toaster', 'SweetAlert','BaseDataService'

    initialize: ->

    addSubscriber: (subscriber, type) =>
        if @singleMode
            if type == 'function'
                @selection = 
                    id: subscriber.function_id
                    fullName: subscriber.function_name
                    type: 'function'
            else
                subscriber.type = 'user'
                @selection = subscriber
            @selectionChanged()
        else
            subsciberIds = _(@selection).pluck('id')
            if subscriber.function_id in subsciberIds
                @toaster.pop 'warning', '' , 'same user role can not be assigned again' , 2000
                return
            else if subscriber.id in subsciberIds
                @toaster.pop 'warning', '' , 'same user can not be assigned again' , 2000
                return

            if type == 'function'
                @selection.push 
                    id: subscriber.function_id
                    fullName: subscriber.function_name
                    type: 'function'
            else
                subscriber.type = 'user'
                @selection.push subscriber
            @selectionChanged()

    removeSubscriber: (subscriber) =>
        if @singleMode
            @$scope.$apply =>
                @selection = null
                @selectionChanged()
        else
            index = _(@selection).findIndex (func)=>
                func.id == subscriber.id
            @$scope.$apply =>
                @selection.splice(index,1) if index > -1
                @selectionChanged()
        
    displaySubscriberRemovalConfirmation: (subscriber) ->
        @SweetAlert.confirm({
            title: "Are you sure you want to unsubscribe #{subscriber.fullName}?"
            confirmButtonText: 'Yes'
            showLoaderOnConfirm: true
            focusCancel: true
            preConfirm: =>
                @removeSubscriber(subscriber)
        })