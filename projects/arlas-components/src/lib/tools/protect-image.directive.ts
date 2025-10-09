import { HttpClient } from '@angular/common/http';
import { Directive, effect, ElementRef, inject, input, Renderer2 } from '@angular/core';
import { map } from 'rxjs';
import { PROTECTED_IMAGE_HEADER } from '../components/results/utils/results.utils';

/**
 * Directive to fetch an image while adding authorisation headers
 */
@Directive({
  selector: 'img[arlasProtectImage]',
  standalone: true
})
export class ProtectImageDirective {
  private readonly http = inject(HttpClient);
  private readonly imgElement: HTMLImageElement = inject(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);

  /**
   * Src of the image to load
   */
  public arlasProtectImage = input.required<string>();

  public constructor() {
    effect(() => {
      this.http.get(this.arlasProtectImage(), { headers: { [PROTECTED_IMAGE_HEADER]: 'true' }, responseType: 'blob' })
        .pipe(map(blob => URL.createObjectURL(blob)))
        .subscribe(r => {
          this.renderer.setAttribute(this.imgElement, 'src', r);
        });
    });
  }

}
