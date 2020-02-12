import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {map, mergeMap, switchMap} from 'rxjs/operators';
import {Span, TraceService} from '../trace.service';
import {Observable} from 'rxjs';
import {tag} from 'rxjs-spy/operators';

@Component({
  selector: 'app-trace-detail',
  templateUrl: './trace-detail.component.html',
  styleUrls: ['./trace-detail.component.scss']
})
export class TraceDetailComponent implements OnInit {
  trace: Observable<Span | undefined>;
  childSpans: Observable<[number, Span][]>;

  constructor(
    private route: ActivatedRoute,
    public traceService: TraceService,
  ) {
  }

  ngOnInit(): void {
    this.trace = this.route.paramMap.pipe(
      switchMap((param: ParamMap) => this.traceService.getSpan(param.get('id'))),
      tag('trace-detail-id')
    );

    this.childSpans = this.trace.pipe(
      switchMap(trace => {
        if (trace === undefined) {
          return [];
        } else {
          return this.traceService.getDescendentSpans(trace.id);
        }
      })
    );
  }
}
