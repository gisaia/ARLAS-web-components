export class PitchToggle {
    public bearing: number;
    public pitch: number;
    public minpitchzoom: number;
    public map: any;
    public btn: HTMLButtonElement;
    public container: HTMLDivElement;
    public image3D = 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMCIgaGVpZ2h0PSIzM' +
    'CI+ICAgIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkeT0iLjM1ZW0iIHN0eWxlPSJmb250LXNpemU6IDE0cHg7IGZvbnQtZmFtaWx5OiAnSGVsdmV0aWNhIE5ldWUnLEFya' +
    'WFsLEhlbHZldGljYSxzYW5zLXNlcmlmOyBmb250LXdlaWdodDogYm9sZDsgdGV4dC1hbmNob3I6IG1pZGRsZTsiPjNEPC90ZXh0Pjwvc3ZnPg==)';
    public image2D = 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMCIgaGVpZ2h0PSIzM' +
    'CI+ICAgIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkeT0iLjM1ZW0iIHN0eWxlPSJmb250LXNpemU6IDE0cHg7IGZvbnQtZmFtaWx5OiAnSGVsdmV0aWNhIE5ldWUnLEFyaWF' +
    'sLEhlbHZldGljYSxzYW5zLXNlcmlmOyBmb250LXdlaWdodDogYm9sZDsgdGV4dC1hbmNob3I6IG1pZGRsZTsiPjJEPC90ZXh0Pjwvc3ZnPg==)';

    constructor(bearing, pitch, minpitchzoom) {
        this.bearing = bearing;
        this.pitch = pitch;
        this.minpitchzoom = minpitchzoom;
    }

    public onAdd(map) {
        this.map = map;
        this.btn = document.createElement('button');
        this.btn.className = 'mapboxgl-ctrl-icon';
        this.btn.style.backgroundImage = this.image3D;
        this.btn.type = 'button';
        this.btn['aria-label'] = 'Toggle Pitch';
        this.btn.onclick = () => {
            if (map.getPitch() === 0) {
                const options = { pitch: this.pitch, bearing: this.bearing, minpitchzoom: null };
                if (this.minpitchzoom && map.getZoom() > this.minpitchzoom) {
                    options.minpitchzoom = this.minpitchzoom;
                }
                map.easeTo(options);
                this.btn.style.backgroundImage = this.image2D;
            } else {
                map.easeTo({ pitch: 0, bearing: 0 });
                this.btn.style.backgroundImage = this.image3D;
            }
        };
        this.container = document.createElement('div');
        this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
        this.container.appendChild(this.btn);
        return this.container;
    }

    public onRemove() {
        this.container.parentNode.removeChild(this.container);
        this.map = undefined;
    }
}


export class ControlButton {

    public map: any;
    public btn: HTMLButtonElement;
    public container: HTMLDivElement;
    public icon;
    constructor(icon: string) {
        this.icon = icon;

    }
    public onAdd(map) {
        this.map = map;
        this.btn = document.createElement('button');
        this.btn.className = 'mapboxgl-ctrl-icon';
        this.btn.style.backgroundImage = this.icon;
        this.btn.style.backgroundRepeat = 'no-repeat';
        this.btn.style.backgroundPosition = '3px 4px';
        this.btn.type = 'button';
        this.btn['aria-label'] = 'Add Geobox';

        this.container = document.createElement('div');
        this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
        this.container.appendChild(this.btn);
        return this.container;
    }
    public onRemove() {
        this.container.parentNode.removeChild(this.container);
        this.map = undefined;
    }
}
