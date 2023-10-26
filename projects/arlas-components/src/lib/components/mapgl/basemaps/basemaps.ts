import { BasemapStyle, BasemapsConfig, OfflineBasemapsConfig } from './basemap.config';
import { OfflineBasemap } from './offline-basemap';
import { OnlineBasemap } from './online-basemap';

export class ArlasBasemaps {
  private config: BasemapsConfig;
  public isOnline;
  public onlineBasemaps: OnlineBasemap;
  public offlineBasemaps: OfflineBasemap;
  public constructor(config: BasemapsConfig, defaultBasemapStyle?: BasemapStyle, basemapStyles?: BasemapStyle[]) {
    if (defaultBasemapStyle && basemapStyles && !config) {
      /** Retrocompatibility code. To be removed in v25.0.0 */
      this.isOnline = true;
      this.onlineBasemaps = new OnlineBasemap({
        styles: basemapStyles,
        defaultStyle: defaultBasemapStyle
      });
    } else {
      this.config = config;
      this.throwErrorBasemapAbscense();
      this.throwErrorOnlineAbscense();
      this.throwErrorOfflineAbscense();
      this.isOnline = config.isOnline;
      if (this.isOnline) {
        this.onlineBasemaps = new OnlineBasemap(this.config.onlineConfig);
      } else {
        this.offlineBasemaps = new OfflineBasemap(this.config.offlineConfig);
      }
    }
  }

  private throwErrorBasemapAbscense() {
    if (!this.config) {
      throw new Error('Basemap configuration is not set.');
    }
  }

  private throwErrorOnlineAbscense() {
    if (this.config.isOnline && !this.config.onlineConfig) {
      throw new Error('Online basemap configuration is not set.');
    }
  }

  private throwErrorOfflineAbscense() {
    if (this.config.isOnline && !this.config.offlineConfig) {
      throw new Error('Offline basemap configuration is not set.');
    }
  }
}



