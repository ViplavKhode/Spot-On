const socket = io();
let myState = null;

if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            myState = { latitude, longitude };
            socket.emit("send-location", { latitude, longitude });
            updateAllDistances();
        },
        (error) => {
            console.error(error);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );
}

const map = L.map("map").setView([0, 0], 16);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: 'stay-close by Viplav Khode'
}).addTo(map);

const markers = {};

function updateAllDistances() {
    if (!myState) return;
    Object.keys(markers).forEach(id => {
        updateMarkerDistance(id);
    });
}

function updateMarkerDistance(id) {
    const marker = markers[id];
    if (!marker || !myState) return;

    if (id === socket.id) {
        if (!marker.getPopup()) marker.bindPopup("You are here");
        else marker.setPopupContent("You are here");
        return;
    }

    const markerLatLng = marker.getLatLng();
    const myLatLng = L.latLng(myState.latitude, myState.longitude);
    const distance = myLatLng.distanceTo(markerLatLng);

    const distStr = distance > 1000
        ? `${(distance / 1000).toFixed(2)} km`
        : `${Math.round(distance)} m`;

    const popupContent = `Distance: ${distStr}`;

    if (marker.getPopup()) {
        marker.setPopupContent(popupContent);
    } else {
        marker.bindPopup(popupContent);
    }
}

socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;

    if (id === socket.id) {
        map.setView([latitude, longitude]);
    }

    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
    } else {
        markers[id] = L.marker([latitude, longitude]).addTo(map);
    }

    updateMarkerDistance(id);
});

socket.on("existing-users", (users) => {
    for (const id in users) {
        const { latitude, longitude } = users[id];
        if (markers[id]) {
            markers[id].setLatLng([latitude, longitude]);
        } else {
            markers[id] = L.marker([latitude, longitude]).addTo(map);
        }
        updateMarkerDistance(id);
    }
});

socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});

