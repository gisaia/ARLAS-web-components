import { NgModule } from '@angular/core';
import { ArlasMaplibreComponent } from './arlas-maplibre.component';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { httpLoaderFactory } from 'app/app.module';
import { HttpClient } from '@angular/common/http';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';



@NgModule({
  declarations: [
    ArlasMaplibreComponent
  ],
  imports: [
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    MatTooltipModule,
    MatIconModule
   ],
  exports: [
    ArlasMaplibreComponent
  ]
})
export class ArlasMaplibreModule { }
