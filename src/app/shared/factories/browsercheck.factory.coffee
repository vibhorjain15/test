angular.module('diligenceVault').factory 'BrowserCheckService', () ->
  new class BrowserCheckService

    isChrome: ->
        !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime)

    isInternetExplorer: ->
        !!document.documentMode
    
    isEdge: ->
        !@isInternetExplorer() && !!window.StyleMedia

    isFirefox: ->
        typeof InstallTrigger != 'undefined'
    
    isSafari: ->
        /constructor/i.test(window.HTMLElement) || 
        ((p) ->
            p.toString() == "[object SafariRemoteNotification]" 
        )(!window['safari'] || (typeof safari != 'undefined' && safari.pushNotification))