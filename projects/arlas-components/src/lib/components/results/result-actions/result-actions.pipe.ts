import { Pipe, PipeTransform } from '@angular/core';
import { Action, ActionHandler } from '../utils/results.utils';

@Pipe({
    name: 'actionDisplayer'
})
export class ActionDisplayerPipe implements PipeTransform {

    transform(a: Action, displayElement: 'label' | 'tooltip' | 'id' | 'icon') {
        switch (displayElement) {
            case 'label':
                return ActionHandler.isReversible(a) ?
                    (a.activated ? a.reverseAction?.label : a.label) :
                    a.label;
            case 'tooltip':
                return ActionHandler.isReversible(a) ?
                    (a.activated ? a.reverseAction?.tooltip : a.tooltip) :
                    a.tooltip;
            case 'id':
                return ActionHandler.isReversible(a) ?
                    (a.activated ? a.reverseAction?.id : a.id) :
                    a.id;
            case 'icon':
                return ActionHandler.isReversible(a) ?
                    (a.activated ? a.reverseAction?.icon : a.icon) :
                    a.icon;
        }

    }
}