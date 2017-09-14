export class ItemComponent {
  public isChecked = false;


  public setSelectedItem(identifier: string, selectedItems: Array<string>) {
    this.isChecked = !this.isChecked;
    const index = selectedItems.indexOf(identifier);
    if (this.isChecked) {
      if (index === -1) {
        selectedItems.push(identifier);
      }
    } else {
      if (index !== -1) {
        selectedItems.splice(index, 1);
      }
    }
  }
}
