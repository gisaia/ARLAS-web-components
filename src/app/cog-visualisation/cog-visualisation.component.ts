import { Component } from '@angular/core';
import {
  ResultCogVisualisationShortcutComponent
} from "../../../projects/arlas-components/src/lib/components/results/result-cog-visualisation-shortcut/result-cog-visualisation-shortcut.component"
import {
  ResultCogVisualisationModalComponent
} from "../../../projects/arlas-components/src/lib/components/results/result-cog-visualisation-modal/result-cog-visualisation-modal.component";

@Component({
  selector: 'arlas-cog-visualisation',
  standalone: true,
  imports: [
    ResultCogVisualisationShortcutComponent,
    ResultCogVisualisationModalComponent
  ],
  templateUrl: './cog-visualisation.component.html',
  styleUrl: './cog-visualisation.component.scss'
})
export class CogVisualisationComponent {

}
