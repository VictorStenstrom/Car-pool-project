//
// Inviewanimation
// v1.0 - (by Isak?)

(function () {
    var ivaobjects = document.querySelectorAll("[data-inviewanimation]");

    function checkIVAObjects() {

        for (var x = 0; x < ivaobjects.length; x++) {
            var rect = ivaobjects[x].getBoundingClientRect();
            if (ivaobjects[x].hasAttribute("data-inviewanimation") && rect.top < window.innerHeight && rect.bottom > 0) {
                ivaobjects[x].removeAttribute("data-inviewanimation");
                ivaobjects[x].classList.add("inview");
            }
        }
    }
    checkIVAObjects();
    document.addEventListener("scroll", checkIVAObjects, false);
})();