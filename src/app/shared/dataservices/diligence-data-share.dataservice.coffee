angular.module('diligenceVault').factory 'DiligenceDataSaveService', (Restangular,$q,$rootScope,toaster) ->

    new class DiligenceDataSaveService
        response_bucket = {}
        sequence_bucket = {}
        unsaved_count = 0
        projectsParams = null

        getResponseObject : =>
            response_bucket
        
        setResponseObject : (response)=>
            response_bucket = response

        getSequenceObject : =>
            sequence_bucket
        
        setSequenceObject : (sequence)=>
            sequence_bucket = sequence

        scrollToResponse: (response) ->
            element = response.scope.element
            scrollTop = element.offset().top - $('.navbar-fixed-top').outerHeight() - $('.menu-bar').outerHeight()

            $("html body").animate({
                scrollTop: scrollTop
            }, 500, -> element.find('.form-control').focus())
            element.focus()

        #method that sets the is_WIP value to true
        setResponseWIP: (response) =>
            if response.attributes['is_NA'] == true
                response.attributes['is_WIP'] = false
            else
                response.attributes['is_WIP'] = true

        commitUnsavedChanges: (exiting_route,set_WIP)=>
            unsaved_responses = response_bucket.getEntitiesForMethod('update')
            invalid_response = _(unsaved_responses).findWhere({is_valid: false})
            deferred = $q.defer()

            if invalid_response?
                scrollToResponse(invalid_response)
                toaster.pop 'error', '', 'Please fix the errors'
                return false

            #if MarkWIP button was clicked then change the is_WIP attribute of each question that was modified
            @setResponseWIP response for response in response_bucket.requests.update if set_WIP == "Save as Draft"
            sequence_bucket.sync('create', 'remove').then =>
                $rootScope.$emit 'sequence:save'

                response_bucket.sync('update', 'remove').then =>
                    $rootScope.$emit 'response:save', exiting_route
                    deferred.resolve()
                ,(error) =>
                    #reject the promise in case of error
                    deferred.reject()
            ,(error) =>
                #reject the promise in case of error
                deferred.reject()

            deferred.promise

        setProjectsParams: (params)=>
            projectsParams = params

        getProjectsParams: =>
            return projectsParams

        resetProjectsParams: =>
            projectsParams = null