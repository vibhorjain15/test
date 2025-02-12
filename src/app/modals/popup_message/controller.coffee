class PopupMessageController extends ModalController

    @register 'PopupMessageController'

    @inject '$uibModalInstance','BrowserCheckService'

    messageHeader = "<strong>A popup blocker maybe preventing you from connecting to DiligenceVault. If you have a popup blocker, please follow the instructions below to enable the connection to DiligenceVault:</strong>"

    otherMessage = "<strong>A popup blocker maybe preventing you from connecting to DiligenceVault</strong>"

    chromeMessage="<ol class='space-on-top-lg'>
                        <li>Click the Customize and Control Google Chrome menu (the three vertical dots in the upper right corner)</li>
                        <li>Select <b>Settings</b></li>
                        <li>Click the <b>show advanced settings</b>...at the bottom</li>
                        <li>Under Privacy, click the <b>Content Settings</b> button</li>
                        <li>Click on <b>Popups and redirects</b></li>
                        <li>To enable popups on specific sites, add <b>app.diligencevault.com</b> in the allowed section</li>
                        <li>To disable all popups, check the <b>Allow all sites to show popups</b> box</li>
                    <ol>"

    ieMessage = "<ol class='space-on-top-lg'>
                    <li>Click the Settings menu</li>
                    <li>Select <b>Internet Options</b></li>
                    <li>In the Popup that opened, goto the <b>Privacy</b> Tab</li>
                    <li>Uncheck the <b>turn on popup blocker</b> option below if you want to enable all the popups</li>
                    <li>To enable on specific sites, click on the settings button beside the checkbox</li>
                    <li>In the popup that opened, add <b>app.diligencevault.com</b> in the first text box and click <b>Add</b></li>
                <ol>"
    
    edgeMessage = "<ol class='space-on-top-lg'>
                        <li>Click the Settings menu (the three horizontal dots in the upper right corner)</li>
                        <li>Select <b>Settings</b></li>
                        <li>Click the <b>Privacy & Security</b> tab</li>
                        <li>Scroll to the bottom of the window</li>
                        <li>Under the <b>Security</b> section, uncheck the <b>block popups</b> checkbox</li>
                    <ol>"

    firefoxMessage = "<ol class='space-on-top-lg'>
                        <li>Click the Settings menu (the three horizontal bars in the upper right corner)</li>
                        <li>Select <b>Options</b></li>
                        <li>Go to the <b>Privacy & Security</b> Tab</li>
                        <li>To enable specific websites, Click on the <b>Exceptions</b> button beside the block button and add <b>app.diligencevault.com</b> to the list</li>
                        <li>To enable all popups, uncheck the <b>Block Popup windows</b></li>
                    <ol>"

    safariMessage = "<ol class='space-on-top-lg'>
                        <li>Click the Settings menu</li>
                        <li>Uncheck the option that says <b>Block Popup windows</b></li>
                    <ol>"
    
    @popupMessage = ""

    initialize: ->
        if @BrowserCheckService.isChrome()                      #check for google chrome
            @popupMessage = messageHeader + chromeMessage
        else if @BrowserCheckService.isInternetExplorer()       #check for internet explorer
            @popupMessage = messageHeader + ieMessage
        else if @BrowserCheckService.isEdge()                   #check for edge
            @popupMessage = messageHeader + edgeMessage
        else if @BrowserCheckService.isFirefox()                #check for firefox
            @popupMessage = messageHeader + firefoxMessage
        else if @BrowserCheckService.isSafari()                 #check for safari
            @popupMessage = messageHeader + safariMessage
        else
            @popupMessage = otherMessage                        #for other browsers not in the list

    cancel: -> 
        @$uibModalInstance.dismiss 'cancel'