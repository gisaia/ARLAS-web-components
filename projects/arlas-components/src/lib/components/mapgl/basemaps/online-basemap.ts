import { BasemapStyle, OnlineBasemapConfig } from './basemap.config';

export class OnlineBasemap {

    private LOCAL_STORAGE_BASEMAPS = 'arlas_last_base_map';

    private config: OnlineBasemapConfig;
    public _selectedStyle: BasemapStyle;
    public _styles: BasemapStyle[];

    public constructor(config: OnlineBasemapConfig) {
        this.config = config;
        this.getSelected();
    }

    public styles(): BasemapStyle[] {
        if (!this._styles) {
            this._styles = this.getAllBasemapStyles(this.config.defaultStyle, this.config.styles);
        }
        return this._styles;
    }

    public setSelected(styele: BasemapStyle) {
        this._selectedStyle = styele;
        return this;
    }

    public getSelected(): BasemapStyle {
        if (!this._selectedStyle) {
            const styles = this.styles();
            const localStorageBasemapStyle: BasemapStyle = JSON.parse(localStorage.getItem(this.LOCAL_STORAGE_BASEMAPS));
            if (localStorageBasemapStyle && styles.filter(b => b.name === localStorageBasemapStyle.name
                && b.styleFile === localStorageBasemapStyle.styleFile).length > 0) {
                this._selectedStyle = localStorageBasemapStyle;
                return this._selectedStyle;
            }
            if (styles && styles.length > 0) {
                this._selectedStyle = styles[0];
            } else {
                throw new Error('No Style is defined for the online basemap');
            }
        }
        return this._selectedStyle;
    }


    private getAllBasemapStyles(defaultBasemapTheme: BasemapStyle, basemapStyles: BasemapStyle[]): Array<BasemapStyle> {
        const allBasemapStyles = new Array<BasemapStyle>();
        if (basemapStyles) {
            basemapStyles.forEach(b => allBasemapStyles.push(b));
            if (defaultBasemapTheme) {
                if (basemapStyles.map(b => b.name).filter(n => n === defaultBasemapTheme.name).length === 0) {
                    allBasemapStyles.push(defaultBasemapTheme);
                }
            }
        } else if (defaultBasemapTheme) {
            allBasemapStyles.push(defaultBasemapTheme);
        }
        return allBasemapStyles;
    }
}
