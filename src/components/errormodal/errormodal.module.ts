import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorModalComponent, ErrorModalMsgComponent } from './errormodal.component';

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [ErrorModalComponent, ErrorModalMsgComponent],
    exports: [ErrorModalComponent, ErrorModalMsgComponent]
})
export class ErrorModalModule { }
