import { Component } from '@angular/core';
import { MdDialog, MdDialogRef } from '@angular/material';

@Component({
  selector: 'arlas-errormodal',
  templateUrl: './errormodal.component.html',
  styleUrls: ['./errormodal.component.css']
})
export class ErrorModalComponent {

  public dialogRef: MdDialogRef<any>;
  constructor(public dialog: MdDialog) { }
  public openDialog() {
    this.dialogRef = this.dialog.open(ErrorModalMsgComponent);
  }
}

@Component({
  selector: 'arlas-errormodal-msg',
  templateUrl: './errormodalmsg.component.html',
})
export class ErrorModalMsgComponent {
  public message: string;
  constructor(public dialogRef: MdDialogRef<ErrorModalMsgComponent>) { }
}
