import { browser, by, element } from 'protractor';

export class ArlasWebComponentsPage {
  navigateTo() {
    return browser.get('/');
  }

  getParagraphText() {
    return element(by.css('gisaia-root h1')).getText();
  }
}
