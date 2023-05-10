import { NgModule } from '@angular/core';
import { PowerbarComponent } from './powerbar.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { FormatNumberModule } from '../../../pipes/format-number/format-number.module';
import { ShortenNumberModule } from '../../../pipes/shorten-number/shorten-number.module';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';

@NgModule({
    imports: [
        CommonModule,
        MatTooltipModule,
        MatCheckboxModule,
        TranslateModule,
        ShortenNumberModule,
        FormatNumberModule
    ],
    declarations: [PowerbarComponent],
    exports: [PowerbarComponent]
})
export class PowerbarModule {

}
