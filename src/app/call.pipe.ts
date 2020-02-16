import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'call'
})
export class CallPipe implements PipeTransform {
  transform(
    templateValue: any,
    fnReference: (...args: any[]) => any,
    ...fnArguments: any[]
  ): any {

    // Due to the way pipes receive arguments, we may have inputs on both sides of
    // the function reference. As such, let's join the two input sets.
    fnArguments.unshift(templateValue);

    // CAUTION: The function reference will NOT BE INVOKED IN THE COMPONENT CONTEXT.
    // As such, a component must bind the reference if it needs to use the "this"
    // scope within the function body.
    return (fnReference.apply(null, fnArguments));

  }

}
