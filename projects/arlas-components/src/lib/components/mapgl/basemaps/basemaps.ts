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
    return this._styles.filter(b => !b.errored);
  }

  public setSelected(style: BasemapStyle) {
    this._selectedStyle = style;
    return this;
  }

  public getStyle(b: BasemapStyle) {
    return this.styles().find(s => s.name === b?.name);
  }

  public getSelected(): BasemapStyle {
    if (!this._selectedStyle) {
      const styles = this.styles();
      const localStorageBasemapStyle: BasemapStyle = JSON.parse(localStorage.getItem(this.LOCAL_STORAGE_BASEMAPS));
      const sameNameBasemaps = localStorageBasemapStyle ? styles.filter(b => b.name === localStorageBasemapStyle.name) : [];
      if (sameNameBasemaps.length > 0) {
        this._selectedStyle = sameNameBasemaps[0];
      } else if (!!this.getStyle(this.defaultBasemapStyle)) {
        this._selectedStyle = this.getStyle(this.defaultBasemapStyle);
      } else if (styles && styles.length > 0) {
        this._selectedStyle = styles[0];
      } else {
        this._selectedStyle = {
          name: 'Background',
          styleFile: {
            version: 8,
            sources: {},
            layers: [
              {
                id: 'backgrounds',
                type: 'background',
                paint: {
                  'background-color': 'rgba(0,0,0,0)'
                }
              }
            ]
          }
        };
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



