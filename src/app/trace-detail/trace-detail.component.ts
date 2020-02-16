import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {map, switchMap} from 'rxjs/operators';
import {Log, Span, TraceService} from '../trace.service';
import {combineLatest, Observable} from 'rxjs';
import {tag} from 'rxjs-spy/operators';

@Component({
  selector: 'app-trace-detail',
  templateUrl: './trace-detail.component.html',
  styleUrls: ['./trace-detail.component.scss']
})
export class TraceDetailComponent implements OnInit {
  trace: Observable<Span | undefined>;
  childSpans: Observable<[number, Span, Log[]][]>;

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

    const childSpans = this.trace.pipe(
      switchMap(trace => {
        if (trace === undefined) {
          return [];
        } else {
          return this.traceService.getSelfAndDescendentSpans(trace.id);
        }
      })
    );

    this.childSpans = combineLatest([childSpans, this.traceService.streamLogMaps]).pipe(
      map(observables => {
          const [spans, logMaps] = observables;
          const spansWithLogs: [number, Span, Log[]][] = [];
          for (const [level, span] of spans) {
            const logs = logMaps.get(span.id) ?? [];
            spansWithLogs.push([level, span, logs]);
          }
          return spansWithLogs;
        }
      ),
      tag('childSpans')
    );
  }
}
