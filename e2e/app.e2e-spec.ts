import { ArlasWebComponentsPage } from './app.po';

describe('arlas-web-components App', () => {
  let page: ArlasWebComponentsPage;

  beforeEach(() => {
    page = new ArlasWebComponentsPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to gisaia!!');
  });
});
