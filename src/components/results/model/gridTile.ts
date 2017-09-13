export class GridTile {

  public id: string;
  public urlImage: string;
  public urlThumbnail: string;
  public title: string;

  constructor(id: string, urlImage: string, urlThumbnail: string, title: string ) {
    this.id = id;
    this.urlImage = urlImage;
    this.urlThumbnail = urlThumbnail;
    this.title = title;
  }

}
