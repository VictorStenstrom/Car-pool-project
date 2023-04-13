// Polyfill to enable .forEach from .querySelectorAll in older IE-browsers
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = function (callback, thisArg) {
        thisArg = thisArg || window;
        for (var i = 0; i < this.length; i++) {
            callback.call(thisArg, this[i], i, this);
        }
    };
}

var Easyweb = (function () {
    "use strict";
    var version = "1.6";

    var init = function (options) {

        // Set options if provided
        //
        setOptions(options);

        // Runs the cookie bar handler script immediately
        //
        initCookieFunctionality();

        // Initializes simple toogle mode with:
        // ew-toggle="classname"
        //
        registerTogglers();

        // Registrerar möjlighet för en "scroll-load"-funktion vid långa listor för "auto-paging"
        // (följande X antal satt i byggaren appendas till listan när ens scroll närmar sig botten)
        //
        registerAutoLoad();

        // Registrerar möjlighet för en "klick-load"-knapp vid långa listor för "auto-paging"
        // (följande X antal satt i byggaren appendas till listan när man klickar på en knapp, ex. "Ladda fler")
        //
        registerClickLoad();

        // .state--active för labels och auto-resize för textarea
        //
        registerFormFunctions();

        // Instagram-komponent-loader som hämtar instagram-innehåll med ajax för efter att sidan laddats in om komponenten finns
        // Se: https://gitlab.sphinx.se/albatross/albatross-source/-/tree/master/Plugins/Albatross.Plugins.Instagram
        //
        registerEwsInstagram();

        // Ponty-komponent-loader som hämtar ponty-jobs med ajax för efter att sidan laddats in om komponenten finns
        //
        registerEwsPonty()
    };

    //#region - Consent cookie -

    /**
     * Plockar upp klick på kakans knapp, sätter kaka för att registrera att den klickats på, tar sedan bort klassen 'hidden' från kak-containern om kaka redan finns
     * */
    var initCookieFunctionality = (function () {

        var privacyCookieName = "EW.Privacy.Consent";
        var removeCookieBar = function (cookieContainerElement) {
            var onRemoveButtonClick = function (el) {
                var cookieToAdd = privacyCookieName + '=yes;expires=' + new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)).toGMTString() + ';path=/;samesite=lax';
                document.cookie = cookieToAdd;
                cookieContainerElement.setAttribute('class', 'hidden');
            };
            return onRemoveButtonClick;
        };

        if (document.cookie && document.cookie.indexOf(privacyCookieName) > -1) {
            return;
        }

        var cookieContainerElement = document.getElementById('ew-cookieinfo-container');
        if (!cookieContainerElement)
            return;

        var cookieButtonElement = document.getElementById('ew-cookieinfo-button-ok');
        if (!cookieButtonElement)
            return;

        cookieButtonElement.addEventListener('click', removeCookieBar(cookieContainerElement), false);

        cookieContainerElement.setAttribute('class', '');

    });
    //#endregion

    //#region - Run delayed -
    var delayedFunctions = [];
    var delayed = false;
    /** 
     Kör samtliga registrerade delayed functions och avvregistrerar dem sedan.
     */
    var onDelayed = function () {
        if (delayedFunctions.length === 0)
            return;

        delayedFunctions.forEach(function (functionToRun) {
            if (typeof functionToRun === 'function')
                functionToRun();
        });
        delayedFunctions = [];
    };

    /**
     * Registrerar en funktion att köra delayed, 
     * vilket innebär att den körs först på första scroll, alt. om sidan laddats om efter scroll och scroll-top inte är 0 efter 500ms
     * @param {any} functionToRun Funktionen som kommer att köras vid scroll eller om redan scroll.
     */
    var runDelayed = function (functionToRun) {
        // Laddar vi in sidan "scrollad" (reload) körs funktionen direkt efter 500ms
        //
        var currentScrollPosition = window.scrollY || document.documentElement.scrollTop;
        if (currentScrollPosition > 0) {
            if (typeof functionToRun === 'function')
                window.setTimeout(function () {
                    functionToRun();
                }, 500);
            return;
        }

        if (document.body.clientHeight < window.innerHeight) {
            if (typeof functionToRun === 'function')
                window.setTimeout(function () {
                    functionToRun();
                }, 500);
            return;
        }

        // Annars registrerar vi dne som en delayed funktion
        //
        delayedFunctions.push(functionToRun);

        // Om vi inte redan markerat att delay är i play, markerar vi det, och registrerar att onDelayed() ska köras på scroll.
        //
        if (!delayed) {
            delayed = true;
            window.addEventListener("scroll", function () {
                onDelayed();
            });
        }
    };

    //#endregion

    /**
     * Svarar med huruvida debug-läget är aktiverat under körning (ofta enbart vid utvckling)
     * */
    var inDebug = window.albatrossInDebug !== undefined ? window.albatrossInDebug : false;

    /**
     * Kontrollerar om angivet argument är en giltig e-postadress
     * @param {any} emailAddress E-postadress att kontroller
     */
    var isEmail = function (emailAddress) {
        var pattern = new RegExp(/^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/);
        return pattern.test(emailAddress);
    };

    var defaultOptions = {
        loaderMarkup: "<div class='form-loader'><i class='ew-loader'><i></i></i></div>"
    };

    var setOptions = function (options) {
        if (options === undefined || typeof options !== 'object')
            return;
        for (var key in options) {
            defaultOptions[key] = options[key];
        }
        return defaultOptions;
    };

    /**
     * Enkel localstorage-helper via Easyweb.storage.setItem samt Easyweb.storage.getItem.
     * Används med fördel för att vid senare tillfälle uppdatera från localStorage till framtida mer effektiva storage-lösningar
     * */
    var storage = {
        isSupported: "localStorage" in window && null !== window.localStorage,
        setItem: function (key, val) {
            if (!this.isSupported) return;
            if (key === null || key === undefined)
                window.localStorage.removeItem(key);
            else
                window.localStorage.setItem(key, val);
        },
        getItem: function (key) {
            if (!this.isSupported) return null;
            return window.localStorage.getItem(key);
        }
    };

    /**
     * Enkel ajax-laddare för att hämta en url och specificera callback för success samt error.
     * Främst menad att enkelt bygga bort jQuery-beroenden. Inkluderar cache-breaker.
     * @param {any} url Url att anrop
     * @param {any} responseCallback Callback som anropas vid lyckat anrop. Anropas med hela responset (requestet) som argument.
     * @param {any} errorCallback // Callback som anropas vid misslyckat anrop. Anropas med hela responset (requestet) som argument.
     */
    var httpGet = function (url, responseCallback, errorCallback) {
        var ajax = new XMLHttpRequest();
        ajax.onreadystatechange = function () {
            if (this.readyState === 4) {
                if (this.status === 200) {
                    if (typeof (responseCallback) !== 'undefined')
                        responseCallback(this);
                }
                else {
                    if (typeof (errorCallback) !== 'undefined')
                        errorCallback(this);
                }
            }
        };

        var cacheBreaker = Date.now();
        url += url.indexOf("?") > -1 ? ("&jq=" + cacheBreaker) : ("?jq=" + cacheBreaker);

        ajax.open("GET", url, true);
        ajax.setRequestHeader("Content-Type", "application/json");
        ajax.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        ajax.send();
    };


    // Pager counter to know how much we have and should load
    // Notis: Statisk = fungerar bra för en per page load. Bör faktoreras om.
    var currentPage = 1;

    // #region - Auto load on scroll -
    var registerAutoLoad = function () {

        // Quick & dirty element cheon to see whether we should use scroll load
        var autoScrollCallElement = document.getElementById("scroll-load");

        if (autoScrollCallElement) {
            var autoScrollKey = "?key=" + autoScrollCallElement.getAttribute("load-key");
            var autoScrollLoading = false;

            // Container for all items (will be appended to)
            var itemContainer = document.querySelector(".auto-load-container");
            // Each individual item, to count
            var itemSelector = ".auto-load-item";

            // Whether the back is out of items to deliver
            var reachedEndOfItems = false;

            var lastElementPosFromTop = 0;
            var throttled = false;

            // On scroll
            document.addEventListener("scroll", function () {
                lastElementPosFromTop = autoScrollCallElement.getBoundingClientRect().y - window.innerHeight;

                if (!throttled) {
                    window.requestAnimationFrame(onFrame);
                    throttled = true;
                }
            });
            function onFrame() {
                onScroll();
                throttled = false;
            }
            function onScroll() {

                // Return if we're out of items or is already loading an item batch
                if (autoScrollLoading || reachedEndOfItems)
                    return false;

                if (lastElementPosFromTop < 1) {
                    // Mark that we're loading a batch
                    autoScrollLoading = true;
                    // Increase the current pager page loaded
                    currentPage++;

                    // Dirty url creation for the ajax endpoint
                    var requestUrl = autoScrollCallElement.getAttribute("href") || window.location.pathname;
                    // Home path needs to be appended with /home as /template without following url is a potential article url
                    if (requestUrl === "/")
                        requestUrl = "/home";
                    requestUrl += autoScrollKey + "&p=" + currentPage;

                    // To use if neccessary
                    var currentCount = itemContainer.querySelectorAll(itemSelector).length;

                    // Load moar!
                    httpGet("/template" + requestUrl, function (response) {
                        // make elements out of html
                        var loadedItems = document.createRange().createContextualFragment(response.responseText);

                        // If server returned less than our page size, we've reached the end.
                        // 6 is used for Äktavara, should be rewritten to be more dynamic
                        if (loadedItems && loadedItems.childNodes.length < 6)
                            reachedEndOfItems = true;

                        // Append them items and fade 'em in, swooosh
                        itemContainer.appendChild(loadedItems);

                        // We're not longer loading, allowing for the next page to start loading when neccessary
                        autoScrollLoading = false;
                    });

                    // Prevent the browser view to stick to the bottom 
                    // after load by making sure the scroll is not at the end.
                    window.scrollBy(0, -1);
                }
            }
        }
    };

    var registerClickLoad = function () {

        // Quick & dirty element cheon to see whether we should use scroll load
        var clickLoadElement = document.getElementById("click-load");

        if (clickLoadElement) {
            var clickLoading = false;
            var loadKey = clickLoadElement.getAttribute("load-key");

            // Container for all items (will be appended to)
            var itemContainer = document.querySelector(".load-container");
            // Each individual item, to count
            var itemSelector = ".load-item";

            // Whether the back is out of items to deliver
            var reachedEndOfItems = false;

            // On scroll
            clickLoadElement.click(function (e) {
                e.preventDefault();

                // Return if we're out of items or is already loading an item batch
                if (clickLoading || reachedEndOfItems)
                    return false;

                // Mark that we're loading a batch
                clickLoading = true;
                // Increase the current pager page loaded
                currentPage++;

                // Dirty url creation for the ajax endpoint
                var requestUrl = clickLoadElement.getAttribute("href") || window.location.pathname;
                // Home path needs to be appended with /home as /template without following url is a potential article url
                if (requestUrl === "/")
                    requestUrl = "/home";
                requestUrl += loadKey + "&p=" + currentPage;

                // To use if neccessary
                var currentCount = itemContainer.find(itemSelector).length;

                // Load moar!
                httpGet("/template" + requestUrl, function (xhr) {
                    // make elements out of html
                    var loadedItems = document.createRange().createContextualFragment(response.responseText);

                    // If server returned less than our page size, we've reached the end.
                    // 6 is used for Äktavara, should be rewritten to be more dynamic
                    if (loadedItems && loadedItems.childNodes.length < 6)
                        reachedEndOfItems = true;

                    // Append them items and fade 'em in, swooosh
                    itemContainer.appendChild(loadedItems);

                    // We're not longer loading, allowing for the next page to start loading when neccessary
                    clickLoading = false;
                });
            });
        }
    };

    var registerFormFunctions = function () {

        //
        // .state--active på labels
        function setActive(a) { a.classList.add("state--active"); }
        function setInactive(a) { a.classList.remove("state--active"); }

        var inputs = document.querySelectorAll("input, textarea");

        setTimeout(function () {
            inputs.forEach(function (el) {
                if (el.value !== null && el.value.length > 0) {
                    siblings(el, "label", setActive);
                }
            });
        }, 200);

        inputs.forEach(function (el) {
            el.addEventListener("focus", function () {
                siblings(el, "label", setActive);
            });
        });

        inputs.forEach(function (el) {
            el.addEventListener("blur", function () {
                if (this.value.length < 1) {
                    siblings(el, "label", setInactive);
                }
            });
        });

        //
        // auto-resize textarea
        document.querySelectorAll("textarea").forEach(function (el) {
            el.addEventListener("input", function () {
                var cs = window.getComputedStyle(this);
                // reset height to allow textarea to shrink again
                this.style.height = "auto";
                // when "box-sizing: border-box" we need to add vertical border size to scrollHeight
                this.style.height = (this.scrollHeight + parseInt(cs.getPropertyValue("border-top-width")) + parseInt(cs.getPropertyValue("border-bottom-width"))) + "px";
            });
        });

        /*
            Get siblings of element, optional using selector, option perform callback on them.
            Browser Compatibility:
            IE: -, Safari: 7, Chrome: 27, Edge: 79, Firefox: 32
        */
        function siblings(el, sel, cb) {
            var matches = [];
            var targets = sel ? el.parentNode.querySelectorAll(":scope > " + sel) : el.parentNode.children;
            targets.forEach(function (target) {
                if (target !== el) {
                    matches.push(target);
                }
            });
            if (cb) {
                matches.forEach(cb);
            }
            return matches;
        }
    };

    // #endregion

    var registerTogglers = function (node) {
        node = node || document;
        var elements = node.querySelectorAll("[ew-toggle]"),
            targetSelector,
            targetNodes;

        elements.forEach(function (el) {
            targetSelector = el.getAttribute("ew-toggle");
            el.addEventListener("click", function (e) {
                e.preventDefault();

                if (targetSelector) {
                    targetSelector = targetSelector.indexOf(".") === 0 || targetSelector.indexOf("#") === 0 ? targetSelector : targetSelector;
                    targetNodes = el.parentNode.querySelectorAll(targetSelector);
                }
                else {
                    targetNodes = el.children;
                }
                if (targetNodes) {
                    targetNodes.forEach(function (targetEl) { toggleClass(targetEl, "open"); });
                }
            }, false);

            el.removeAttribute("ew-toggle");
        });
    };

    // Toggles a class on an element and stores the value if storageKey is provided
    //
    var toggleClass = function (element, cssClass, storageKey) {
        var toggleVal = null;

        if (element.classList.contains(cssClass)) {
            element.classList.remove(cssClass);
            toggleVal = null;
        }
        else {
            element.classList.add(cssClass);
            toggleVal = "on";
        }
        // Store value if key is specified
        if (storageKey !== undefined) {
            storage.setItem(storageKey, toggleVal);
        }
    };

    // #region BindEwLoad
    var bindEwsLoad = function (el, templateKey) {
        if (!templateKey) {
            console.warn("No template key set in ews-attribute");
            return;
        }

        // Hämta data med en liten delay för att inte sega ner first load vid google-pagespeed-mjäk
        runDelayed(function () {
            // Turn on useJsonApi to return json data instead
            var urlPath = location.pathname,
                useJsonApi = false;

            // Home path needs to be appended with /home as /template without following url is a potential article url
            if (urlPath === "/")
                urlPath = "/home";

            // Full url, like: /template/home?key=instagramfeed
            urlPath = (useJsonApi ? "/api" : "/template") + urlPath + "?key=" + templateKey;

            // Request inner template api with ajax and set response to container
            httpGet(urlPath,
                function (xhr) {
                    if (xhr && xhr.responseText) {
                        el.innerHTML = xhr.responseText;
                    }
                    else {
                        console.warn("Loader returned no response.");
                    }
                },
                function (err) {
                    console.error("Error loading api feed: ", err);
                });

        });
    };
    // #endregion

    // #region - Instagram -
    var registerEwsInstagram = function (node) {
        node = node || document;

        // Attribute to query for and get key value for
        var queryAttributeName = "ews-instagram",
            elements = node.querySelectorAll("[" + queryAttributeName + "]"),
            templateKey;

        elements.forEach(function (el) {
            // Get key set on element printed by the IG-template
            templateKey = el.getAttribute(queryAttributeName);

            // Bind it's load func using element as content-container and key to fetch
            bindEwsLoad(el, templateKey);

            // Remove attribute from element to keep final markupgeneration clean and prevent double registrations
            // if run multiple times
            el.removeAttribute(queryAttributeName);
        });
    };

    // #endregion

    // #region - Ponty -

    var registerEwsPonty = function (node) {
        node = node || document;

        // Attribute to query for and get key value for
        var queryAttributeName = "ews-ponty",
            elements = node.querySelectorAll("[" + queryAttributeName + "]"),
            templateKey;

        elements.forEach(function (el) {
            // Get key set on element printed by the IG-template
            templateKey = el.getAttribute(queryAttributeName);

            // Bind it's load func using element as content-container and key to fetch
            bindEwsLoad(el, templateKey);

            // Remove attribute from element to keep final markupgeneration clean and prevent double registrations
            // if run multiple times
            el.removeAttribute(queryAttributeName);
        });
    };


    // #endregion




    // Init to be called if in use. Done at top of site/main/default.js
    //
    return {
        init: init,
        runDelayed: runDelayed,
        httpGet: httpGet,
        isEmail: isEmail,
        storage: storage,
        currentPage: currentPage,
        inDebug: inDebug,
        version: version
    };
})();
