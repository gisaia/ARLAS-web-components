import { NgModule, Provider, ModuleWithProviders } from '@angular/core';
import { ArlasColorService } from './color.generator.service';
import { ColorGeneratorLoader, AwcColorGeneratorLoader } from '../components/componentsUtils';

export interface ColorGeneratorModuleConfig {
  loader?: Provider;
}

@NgModule({

})
export class ColorGeneratorModule {
  /**
   * Use this method in your root module to provide the ColorGeneratorLoader
   */
  public static forRoot(config: ColorGeneratorModuleConfig = {}): ModuleWithProviders {
    return {
      ngModule: ColorGeneratorModule,
      providers: [
        config.loader || {provide: ColorGeneratorLoader, useClass: AwcColorGeneratorLoader},
        ArlasColorService
      ]
    };
  }

  public static forChild(config: ColorGeneratorModuleConfig = {}): ModuleWithProviders {
    return {
      ngModule: ColorGeneratorModule,
      providers: [
        config.loader || {provide: ColorGeneratorLoader, useClass: AwcColorGeneratorLoader},
        ArlasColorService
      ]
    };
  }

}
