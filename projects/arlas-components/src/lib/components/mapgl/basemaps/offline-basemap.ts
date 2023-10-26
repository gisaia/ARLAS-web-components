import { OfflineBasemapTheme, OfflineBasemapsConfig } from './basemap.config';

export class OfflineBasemap {

  private config: OfflineBasemapsConfig;
  public _selectedTheme: OfflineBasemapTheme;
  public _themes: OfflineBasemapTheme[];

  public constructor(config: OfflineBasemapsConfig) {
    this.config = config;
    this.getSelected();
  }

  public themes(): OfflineBasemapTheme[] {
    if (!this._themes) {
      this._themes = this.getAllBasemapThemes(this.config.defaultTheme, this.config.themes);
    }
   return this._themes;
  }

  public setSelected(theme: OfflineBasemapTheme) {
    this._selectedTheme = theme;
    return this;
  }

  public getSelected(): OfflineBasemapTheme {
    if (!this._selectedTheme) {
      const themes = this.themes();
      if (themes && themes.length > 0) {
        this._selectedTheme = themes[0];
      } else {
        throw new Error('No theme is defined for the offline basemap');
      }
    }
    return this._selectedTheme;
  }

  public getGlyphs() {
    return this.config.glyphsUrl;
  }

  public getUrl() {
    return this.config.url;
  }

  private getAllBasemapThemes(defaultBasemapTheme: OfflineBasemapTheme, basemapThemes: OfflineBasemapTheme[]): Array<OfflineBasemapTheme> {
    const allBasemapThemes = new Array<OfflineBasemapTheme>();
    if (basemapThemes) {
      basemapThemes.forEach(b => allBasemapThemes.push(b));
      if (defaultBasemapTheme) {
        if (basemapThemes.map(b => b.name).filter(n => n === defaultBasemapTheme.name).length === 0) {
          allBasemapThemes.push(defaultBasemapTheme);
        }
      }
    } else if (defaultBasemapTheme) {
      allBasemapThemes.push(defaultBasemapTheme);
    }
    return allBasemapThemes;
  }
}
