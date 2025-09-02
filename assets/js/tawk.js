var Tawk_API = Tawk_API || {}, Tawk_LoadStart = new Date();

// Hide widget on mobile devices using Tawk's official API
if (window.innerWidth <= 768) {
    Tawk_API.customStyle = {
        visibility : {
            desktop : {
                position : 'br',
                xOffset : 20,
                yOffset : 20
            },
            mobile : {
                position : 'br',
                xOffset : '-9999px',
                yOffset : '-9999px'
            }
        }
    };
}

(function () {
    var s1 = document.createElement("script"), s0 = document.getElementsByTagName("script")[0];
    s1.async = true;
    s1.src = 'https://embed.tawk.to/68a51140457bbd192e508515/1j32cmpgi';
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');
    s0.parentNode.insertBefore(s1, s0);
})();