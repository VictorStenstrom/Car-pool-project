/// <reference path="default/easyweb.core.1.0.js" />
/// <reference path="externalsphinxly/inviewanimation.1.0.js" />
/// <reference path="external/jquery.min.js" />

(function () {
    // #region - Init -

    // Init old funcs from EW-lib
    //
    if (typeof window.Easyweb !== "undefined") {
        window.Easyweb.init();
    }
    else {
        console.warn("easyweb.core.js not present.");
    }

    // #endregion
})();


// Folder structure for site specific code:
//
// js/components
//     Tydligt avskilda komponenter läggs som egna filer här. T.ex. contactMap.js eller productCalculator.js
//
// js/views
//     Sånt som är mindre komponentigt men knutet till en enda vy läggs här.
//
// js/global.js
//     Små globala grejer kan läggas här. Tänk på att avgränsa och klumpa ihop sånt som hör ihop.

const hamburger = document.querySelector('.hamburger');
const heroContent = document.querySelector('.hero');
const submenu = document.querySelector(".submenu");
const dropdown = document.querySelector(".dropdown");

//Hamburger menu start

document.querySelector(".js-hamburger").addEventListener("click", () => {
    const nav = document.querySelector(".nav").classList.toggle("open");
    //const btn = document.querySelector(".btn-header").classList.toggle("open");
    const body = document.querySelector("body").classList.toggle("no-scroll");
    const burger = document.querySelector(".js-hamburger").classList.toggle("open");
})


hamburger.addEventListener("click", () => {
    submenu.classList.add("hamburger-submenu");

    if (heroContent.classList.contains("hide")) {
        heroContent.classList.remove("hide");
    }
    else {
        heroContent.classList.add("hide");
    }
});

//Hamburger menu end


//Submenu start

dropdown.addEventListener("mouseover", () => {
    submenu.classList.add("show");
})

dropdown.addEventListener("mouseout", () => {
    submenu.classList.remove("show");
})

//Submenu end


// Filter news articles start

const tagBtns = document.querySelectorAll("[data-tag]");
const newsItems = document.querySelectorAll("[card-category]");

if (newsItems.length > 0) {
    tagBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            newsItems.forEach((article) => {
                article.classList.remove("show");
                if (btn.getAttribute("data-tag") === "All") {
                    article.classList.remove("show");
                    setTimeout(() => {
                        article.classList.add('show');
                    }, "0.01")

                } else if (article.getAttribute("card-category") === btn.getAttribute('data-tag')) {
                    article.classList.remove("show");
                    setTimeout(() => {
                        article.classList.add('show');
                    }, "0.01")
                }
            })

        })
    })
}

//Filter news articles end


//Search article start

if (window.location.href.includes("?q")) {
    if (newsItems.length > 0) {
        const link = createLink("/news", "Rensa", "#69c7a3", "#00bfa5");
        const newsItems = document.querySelectorAll(".return-button");
        newsItems.forEach((item) => item.appendChild(link));
    } else {
        const text = createText("Inga nyheter hittades");
        const link = createLink("/news", "Ta mig tillbaka", "#69c7a3", "#00bfa5");
        const newsItems = document.querySelectorAll(".return-button");
        newsItems.forEach((item) => {
            item.appendChild(text);
            item.appendChild(link);
        });
    }
    document.querySelector('.btn-light-green').scrollIntoView();
}

function createLink(href, text, color, hoverColor) {
    const link = document.createElement("a");
    link.setAttribute("href", href);
    link.textContent = text;
    link.style.color = color;
    link.style.padding = "20px";
    link.style.textDecoration = "none";
    link.style.transition = "color 0.2s ease-in-out";
    link.addEventListener("mouseenter", () => {
        link.style.color = hoverColor;
    });
    link.addEventListener("mouseleave", () => {
        link.style.color = color;
    });

    link.addEventListener("click", function (event) {
        scrollDown();
    });

    return link;
}

function createText(text) {
    const p = document.createElement("p");
    p.textContent = text;
    return p;
}

function scrollDown() {
    var currentPosition = window.pageYOffset || document.documentElement.scrollTop;
    var newPosition = currentPosition + (window.innerHeight / 2);

    setTimeout(function () {
        window.scrollTo(0, newPosition);
    }, 2000);
}

//Search article end


//Ineractive map start

//const staticLocations = [{
//    id: 'fsdfosddwdfn345345k',
//    name: 'Dagsmejan',
//    longitude: 59.4472953,
//    latitude: 17.9519484,
//    description: 'lorem ipsum'
//},
//{
//    id: 'sdfikjwseouifger32434fdsf',
//    name: 'Häggvik',
//    longitude: 59.43990219999999,
//    latitude: 17.9306324,
//    description: 'lorem ipsum'
//},
//{
//    id: 'fsdfosdfn345345k',
//    name: 'Kista',
//    longitude: 59.40905590000001,
//    latitude: 17.9501393,
//    description: 'lorem ipsum'
//},
//{
//    id: 'fsdfosdfn345345k',
//    name: 'Kvarteret Sländan',
//    longitude: 59.3488355,
//    latitude: 18.0396816,
//    description: 'lorem ipsum'
//}
//];

const locations = [];

function initMap() {
    const mapElement = document.getElementById("map")

    if (mapElement !== null) {
        const map = new google.maps.Map(mapElement, {
            zoom: 11,
            center: { lat: 59.32932349999999, lng: 18.0685808 },
            styles: [
                {
                    "featureType": "water",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                            "color": "#d3d3d3"
                        }
                    ]
                },
                {
                    "featureType": "transit",
                    "stylers": [
                        {
                            "color": "#808080"
                        },
                        {
                            "visibility": "off"
                        }
                    ]
                },
                {
                    "featureType": "road.highway",
                    "elementType": "geometry.stroke",
                    "stylers": [
                        {
                            "visibility": "on"
                        },
                        {
                            "color": "#b3b3b3"
                        }
                    ]
                },
                {
                    "featureType": "road.highway",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                            "color": "#ffffff"
                        }
                    ]
                },
                {
                    "featureType": "road.local",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                            "visibility": "on"
                        },
                        {
                            "color": "#ffffff"
                        },
                        {
                            "weight": 1.8
                        }
                    ]
                },
                {
                    "featureType": "road.local",
                    "elementType": "geometry.stroke",
                    "stylers": [
                        {
                            "color": "#d7d7d7"
                        }
                    ]
                },
                {
                    "featureType": "poi",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                            "visibility": "on"
                        },
                        {
                            "color": "#ebebeb"
                        }
                    ]
                },
                {
                    "featureType": "administrative",
                    "elementType": "geometry",
                    "stylers": [
                        {
                            "color": "#a7a7a7"
                        }
                    ]
                },
                {
                    "featureType": "road.arterial",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                            "color": "#ffffff"
                        }
                    ]
                },
                {
                    "featureType": "road.arterial",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                            "color": "#ffffff"
                        }
                    ]
                },
                {
                    "featureType": "landscape",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                            "visibility": "on"
                        },
                        {
                            "color": "#efefef"
                        }
                    ]
                },
                {
                    "featureType": "road",
                    "elementType": "labels.text.fill",
                    "stylers": [
                        {
                            "color": "#696969"
                        }
                    ]
                },
                {
                    "featureType": "administrative",
                    "elementType": "labels.text.fill",
                    "stylers": [
                        {
                            "visibility": "on"
                        },
                        {
                            "color": "#737373"
                        }
                    ]
                },
                {
                    "featureType": "poi",
                    "elementType": "labels.icon",
                    "stylers": [
                        {
                            "visibility": "off"
                        }
                    ]
                },
                {
                    "featureType": "poi",
                    "elementType": "labels",
                    "stylers": [
                        {
                            "visibility": "off"
                        }
                    ]
                },
                {
                    "featureType": "road.arterial",
                    "elementType": "geometry.stroke",
                    "stylers": [
                        {
                            "color": "#d6d6d6"
                        }
                    ]
                },
                {
                    "featureType": "road",
                    "elementType": "labels.icon",
                    "stylers": [
                        {
                            "visibility": "off"
                        }
                    ]
                },
                {},
                {
                    "featureType": "poi",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                            "color": "#dadada"
                        }
                    ]
                }
            ]
        });

        fetchLocations().then(() => {
            setMarkers(map);
        });
    }
}

function fetchLocations() {
    return new Promise((resolve, reject) => {
        fetch('https://elbilio-admin-server.herokuapp.com/open-locations')
            .then(response => response.json())
            .then(data => {
                data.map(location => {
                    let locationObject = {
                        id: location.id,
                        name: location.name,
                        longitude: location.longitude,
                        latitude: location.latitude,
                        description: location.description ? location.description : "",
                        imageUrl: location.imageUrl,
                        vehicles: location.vehicles.map(vehicle => {
                            return {
                                name: vehicle.name,
                                description: vehicle.description ? vehicle.description : "",
                            };
                        }),
                    };
                    locations.push(locationObject);
                });
                resolve();
            })
            .catch(error => reject(error));
    });
}

function setMarkers(map) {
    const icon = {
        url: 'https://hemulkommunikation.se/permanent/elbilio/mapbox-icon.png',
        scaledSize: new google.maps.Size(50, 50),
    };

    const shape = {
        coords: [0, 0, 70, 70],
        type: 'rect'
    };

    locations.forEach(location => {
        const marker = new google.maps.Marker({
            position: { lat: location.latitude, lng: location.longitude },
            map,
            icon: icon,
            shape: shape,
            title: location.name,
            imageUrl: location.imageUrl,
        });

        marker.addListener("click", () => {
            const vehiclesList = location.vehicles.map(vehicle => `<li>${vehicle.name} - ${vehicle.description}</li>`).join('');
            const contentString = `<div class="popup">
                      <div class="weight-bold">${location.name}</div>
                      <ul>${vehiclesList}</ul>
                      <img class="car-img" src=${location.imageUrl} alt="Pool-bil"/>
                      <a href="https://intercom.help/elbiliohelpcenter/sv/collections/2568250-boka-hyra-och-ladda-fordonet" class="btn btn-secondary btn-light-green">BOKA</a>
                      </div>`;

            const infoWindow = new google.maps.InfoWindow({
                content: contentString,
            });

            infoWindow.open(map, marker);

            map.addListener("click", () => {
                infoWindow.close();
            });
        });
    });
}

window.initMap = initMap;

//Ineractive map end