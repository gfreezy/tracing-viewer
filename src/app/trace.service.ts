import {Injectable} from '@angular/core';
import {bufferTime, filter, map} from 'rxjs/operators';
import {concat, Observable, of, Subject} from 'rxjs';
import {jsonToCamelCase} from './utils/json-to-camel-case';
import {webSocket} from 'rxjs/webSocket';
import {websocketUrl} from './utils/ws-url';
import {tag} from 'rxjs-spy/operators';

@Injectable({
  providedIn: 'root'
})
export class TraceService {
  private readonly streamSpans: Subject<Span[]> = new Subject<Span[]>();

  private readonly topSpans: Span[] = [];
  private readonly streamTopSpans: Observable<Span[]>;
  private readonly spanMaps: Map<string, Span> = new Map<string, Span>();
  private streamSpanMaps: Observable<Map<string, Span>>;

  constructor() {
    const websocket = webSocket(websocketUrl('/api/spans'));
    websocket.asObservable().pipe(
      map((span: Span) => new Span(jsonToCamelCase(span))),
      tag('websocket')
    ).pipe(
      bufferTime(500)
    ).subscribe(this.streamSpans);

    this.initStreamSpanMaps().subscribe();
    this.initStreamTopSpans().subscribe();

    this.streamSpanMaps = this.initStreamSpanMaps();
    this.streamTopSpans = this.initStreamTopSpans();
  }

  initStreamSpanMaps(): Observable<Map<string, Span>> {
    return this.streamSpans.pipe(
      map(spans => {
          for (const span of spans) {
            const old = this.spanMaps.get(span.id);
            if (old !== null && old !== undefined) {
              old.update(span);
            } else {
              this.spanMaps.set(span.id, span);
            }
          }
          return this.spanMaps;
        },
        tag('streamSpanMaps')
      )
    );
  }

  initStreamTopSpans(): Observable<Span[]> {
    const topSpans = this.topSpans;
    const deduplicate = map((spans: Span[]) => {
      for (const span of spans) {
        if (span.parentId !== null) {
          continue;
        }
        const index = topSpans.findIndex(s => s.id === span.id);
        if (index === -1) {
          topSpans.push(span);
        } else {
          const oldSpan = topSpans[index];
          if (span.timestamp >= oldSpan.timestamp) {
            oldSpan.update(span);
          }
        }
      }

      topSpans.sort((a, b) => a.timestamp - b.timestamp);

      const MaxSize = 1000;
      topSpans.splice(0, Math.max(0, topSpans.length - MaxSize));

      return topSpans;
    });

    return this.streamSpans.pipe(
      deduplicate,
      tag('streamTopSpans')
    );
  }

  listTopSpans(): Observable<Span[]> {
    return concat(of(this.topSpans), this.streamTopSpans)
      .pipe(
        tag('listTopSpans')
      );
  }

  getSpan(spanId: string | null): Observable<Span | undefined> {
    return concat(of(this.spanMaps), this.streamSpanMaps).pipe(
      map(maps => {
        if (spanId === null) {
          return undefined;
        } else {
          return maps.get(spanId);
        }
      }),
      tag(`getSpan-${spanId}`)
    );
  }

  getDescendentSpans(spanId: string): Observable<[number, Span][]> {
    const spans: [number, Span][] = [];
    const inSpans = Array.from(this.spanMaps.values()).sort((a, b) => a.timestamp - b.timestamp);
    this._getDescendentSpans(spanId, 1, spans, inSpans);
    return of(spans);
  }

  private _getDescendentSpans(spanId: string, level: number, outSpans: [number, Span][], fromSpans: Span[]) {
    for (const child of getChildSpans(spanId, fromSpans)) {
      outSpans.push([level, child]);
      this._getDescendentSpans(child.id, level + 1, outSpans, fromSpans);
    }
  }
}

function* getChildSpans(spanId: string, fromSpans: Span[]) {
  for (const value of fromSpans) {
    if (value.parentId === spanId) {
      yield value;
    }
  }
}

export class Span {
  id: string;
  parentId: string | null;
  traceId: string;
  name: string;
  timestamp: number;
  duration: number;
  tags: Record<string, string>;
  finished: boolean;

  constructor(obj: any) {
    Object.assign(this, obj);
  }

  getTime(): string {
    const date = new Date(this.timestamp / 1000);

    return `${date.getFullYear()}-${date.getMonth()}-${date.getDay()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
  }

  update(span: Span) {
    let ts: number;
    let duration: number;
    if (span.timestamp <= this.timestamp) {
      ts = span.timestamp;
      duration = this.timestamp - span.timestamp + this.duration;
    } else {
      ts = this.timestamp;
      duration = span.timestamp - this.timestamp + span.duration;
      this.tags = span.tags;
      this.finished = span.finished;
    }
    this.timestamp = ts;
    this.duration = duration;
  }
}
