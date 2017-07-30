import { browser, by, element } from 'protractor';

export class ArlasWebComponentsPage {
  public navigateTo() {
    return browser.get('/');
  }

  public getParagraphText() {
    return element(by.css('gisaia-root h1')).getText();
  }
}
