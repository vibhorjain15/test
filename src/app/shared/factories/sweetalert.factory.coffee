angular.module('diligenceVault').factory 'SweetAlert', (baseData, $injector, $window, $state) ->

  new class Utils
    
    confirm: (config)=>
        params = {
            icon: 'warning'
            allowOutsideClick: false
            allowEscapeKey: true
            showConfirmButton: true
            showCancelButton: true
        }

        params.title = config.title or ""
        params.text = config.text or ""
        params.confirmButtonText = config.confirmButtonText or "Confirm"
        params.cancelButtonText = config.cancelButtonText or "Cancel"
        params.showCloseButton = config.showCloseButton or false
        params.customClass = config.customClass or 'danger'
        params.focusCancel = config.focusCancel or false
        params.showLoaderOnConfirm = config.showLoaderOnConfirm or false
        params.preConfirm = config.preConfirm or null
        params.reverseButtons = if config.reverseButtons == false then false else true
        
        $window.swal.fire(params)

    error: (config)=>
        params = {
            icon: 'error'
            allowOutsideClick: false
            allowEscapeKey: false
            showConfirmButton: true
            showCancelButton: false
        }

        params.title = config.title or ""
        params.text = config.text or ""
        params.confirmButtonText = config.confirmButtonText or "Okay"
        params.showCloseButton = config.showCloseButton or false
        
        $window.swal.fire(params)

    info: (config)=>
        params = {
            icon: 'info'
            allowOutsideClick: false
            allowEscapeKey: false
            showConfirmButton: true
            showCancelButton: false
        }

        params.title = config.title or ""
        params.text = config.text or ""
        params.confirmButtonText = config.confirmButtonText or "Okay"
        params.showCloseButton = config.showCloseButton or false
        
        $window.swal.fire(params)

    success: (config)=>
        params = {
            icon: 'success'
            allowOutsideClick: false
            allowEscapeKey: false
            showConfirmButton: true
            showCancelButton: false
        }

        params.title = config.title or ""
        params.text = config.text or ""
        params.confirmButtonText = config.confirmButtonText or "Okay"
        params.showCloseButton = config.showCloseButton or false
        
        $window.swal.fire(params)

    input: (config)=>
        params = {
            allowOutsideClick: false
            allowEscapeKey: false
            showConfirmButton: true
            showCancelButton: true
        }

        params.title = config.title or ""
        params.text = config.text or ""
        params.confirmButtonText = config.confirmButtonText or "Okay"
        params.showCloseButton = config.showCloseButton or false
        params.input = config.input or 'text'
        
        $window.swal.fire(params)

    premiumAlert: (config)=>
        params = {
            customClass: {
                header: 'premiumAlertHeaderClass',
                image: 'premiumImgClass',
                title: 'premiumTitleClass',
            },
            imageUrl: '/assets/images/premium-crown.png',
            html: "<div style='display: flex;flex-direction: column;justify-content: center;align-items: center;gap: 5px;text-align: center;'><span style='color: #0071a4;font-size: 12px;font-weight: 600;'>PREMIUM FEATURE</span><span style='font-size: 20px;font-weight: 600;'>✨ #{config.title} ✨</span></div><span style='display: flex;flex-direction: column;align-items: center;justify-content: center;gap: 15px;font-size: 16px;font-weight: 400;'>#{config.text}</span>",
            confirmButtonText: 'Get started here',
            showCloseButton:true
        };

        $window.swal.fire(params).then (isConfirm) =>
            if  isConfirm.value
                $state.go 'app.premium'