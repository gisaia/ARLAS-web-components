import mapboxgl from 'mapbox-gl';
import { BasemapStyle } from './basemap.config';

export class ArlasBasemaps {
  private LOCAL_STORAGE_BASEMAPS = 'arlas_last_base_map';
  public _selectedStyle: BasemapStyle;
  public _styles: BasemapStyle[];
  private defaultBasemapStyle: BasemapStyle;
  private basemapStyles?: BasemapStyle[];

  public constructor(defaultBasemapStyle?: BasemapStyle, basemapStyles?: BasemapStyle[]) {
    if (defaultBasemapStyle && basemapStyles) {
      this.defaultBasemapStyle = defaultBasemapStyle;
      this.basemapStyles = basemapStyles;
    } else {
      // todo throw error ?
    }
  }

  public styles(): BasemapStyle[] {
    if (!this._styles) {
      this._styles = this.getAllBasemapStyles(this.defaultBasemapStyle, this.basemapStyles);
    }
    return this._styles;
  }

  public setSelected(style: BasemapStyle) {
    this._selectedStyle = style;
    return this;
  }

  public getSelected(): BasemapStyle {
    if (!this._selectedStyle) {
      const styles = this.styles();
      const localStorageBasemapStyle: BasemapStyle = JSON.parse(localStorage.getItem(this.LOCAL_STORAGE_BASEMAPS));
      if (localStorageBasemapStyle && styles.filter(b => b.name === localStorageBasemapStyle.name
        && 'name' in (b.styleFile as mapboxgl.Style) && 'name' in (localStorageBasemapStyle.styleFile as mapboxgl.Style)
        && (b.styleFile as mapboxgl.Style)?.name === (localStorageBasemapStyle.styleFile as mapboxgl.Style)?.name).length > 0) {
        this._selectedStyle = localStorageBasemapStyle;
      } else if (!!this.defaultBasemapStyle) {
        this._selectedStyle = this.defaultBasemapStyle;
      } else if (styles && styles.length > 0) {
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



