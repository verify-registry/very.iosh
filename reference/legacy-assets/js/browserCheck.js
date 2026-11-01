function checkIsIE() {
    // Check for Internet Explorer in the user agent string
    return /MSIE|Trident/.test(window.navigator.userAgent);
}

var isIE = checkIsIE()

if (isIE) {
    document.getElementById("BrowserNotSupportedBanner").style.display = "block";
};

