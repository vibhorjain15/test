angular.module('diligenceVault').factory 'PopupCheckerService', (ModalFactory) ->
  new class PopupCheckerService

    check: (popup_window)->
        _scope = this;
        if popup_window
            if /chrome/.test(navigator.userAgent.toLowerCase())
                setTimeout () => 
                    _scope.is_popup_blocked(_scope, popup_window);
                ,200
            else
                popup_window.onload = () =>
                    _scope.is_popup_blocked(_scope, popup_window)
        else
            _scope.displayError()
    
    is_popup_blocked: (scope, popup_window) ->
        if (popup_window.innerHeight > 0)==false
            scope.displayError()
    
    displayError: ->
        ModalFactory.invokeModal 'popup_message'