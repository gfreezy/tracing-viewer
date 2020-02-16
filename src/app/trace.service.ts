import {Injectable} from '@angular/core';
import {bufferTime, distinct, map} from 'rxjs/operators';
import {concat, Observable, of, partition, Subject} from 'rxjs';
import {jsonToCamelCase} from './utils/json-to-camel-case';
import {webSocket} from 'rxjs/webSocket';
import {websocketUrl} from './utils/ws-url';
import {tag} from 'rxjs-spy/operators';

@Injectable({
  providedIn: 'root'
})
export class TraceService {
  private readonly streamSpans: Subject<Span[]> = new Subject<Span[]>();
  private readonly streamLogs: Subject<Log[]> = new Subject<Log[]>();

  private readonly topSpans: Span[] = [];
  private readonly streamTopSpans: Observable<Span[]>;
  private readonly spanMaps: Map<string, Span> = new Map<string, Span>();
  private readonly streamSpanMaps: Observable<Map<string, Span>>;

  private readonly logMaps: Map<string, Log[]> = new Map<string, Log[]>();
  readonly streamLogMaps: Observable<Map<string, Log[]>>;

  constructor() {
    const websocket = webSocket(websocketUrl('/api/spans'));
    const [spanStream, logStream] = partition(
      websocket.asObservable()
        .pipe(
          map((d: any) => {
            return {data: jsonToCamelCase(JSON.parse(d.data)), type: d.type};
          }),
        ),
      data => data.type === 'span');

    spanStream.pipe(
      map((span) => new Span(span.data)),
      bufferTime(500),
      distinct(v => v.map(s => s.id).join(',')),
      tag('spanStream')
    ).subscribe(this.streamSpans);

    logStream.pipe(
      map((log) => new Log(log.data)),
      bufferTime(500),
      distinct(v => v.map(s => s.id).join(',')),
      tag('logStream')
    ).subscribe(this.streamLogs);

    this.initStreamSpanMaps();
    this.initStreamTopSpans();
    this.initStreamLogMaps();

    // subscribe order matters, below subscriptions must follow inits before.
    this.streamSpanMaps = concat(of(this.spanMaps), this.streamSpans).pipe(map(_ => this.spanMaps), tag('streamSpanMaps'));
    this.streamTopSpans = concat(of(this.streamSpans), this.streamSpans).pipe(map(_ => this.topSpans), tag('streamTopSpans'));

    this.streamLogMaps = concat(of(this.streamLogs), this.streamLogs).pipe(map(_ => this.logMaps), tag('streamLogMaps'));
  }

  initStreamSpanMaps() {
    this.streamSpans.subscribe(
      spans => {
        for (const span of spans) {
          const old = this.spanMaps.get(span.id);
          if (old !== null && old !== undefined) {
            old.update(span);
          } else {
            this.spanMaps.set(span.id, span);
          }
        }
      }
    );
  }

  initStreamTopSpans() {
    const topSpans = this.topSpans;
    const deduplicate = (spans: Span[]) => {
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
    };

    this.streamSpans.subscribe(deduplicate);
  }

  initStreamLogMaps() {
    this.streamLogs.subscribe(logs => {
        for (const log of logs) {
          let spanLogs = this.logMaps.get(log.spanId);
          if (!spanLogs) {
            spanLogs = [];
            this.logMaps.set(log.spanId, spanLogs);
          }
          spanLogs.push(log);
        }
      }
    );
  }

  listTopSpans(): Observable<Span[]> {
    return this.streamTopSpans
      .pipe(
        tag('listTopSpans')
      );
  }

  getSpan(spanId: string | null): Observable<Span | undefined> {
    return this.streamSpanMaps.pipe(
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

  getSelfAndDescendentSpans(spanId: string): Observable<[number, Span][]> {
    const self = this.spanMaps.get(spanId);
    if (!self) {
      throw new Error('span not exist');
    }
    const spans: [number, Span][] = [[0, self]];
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

function toDate(ts: number): string {
  const date = new Date(ts / 1000);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDay()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
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
  time: string;

  constructor(obj: any) {
    Object.assign(this, obj);

    this.time = toDate(this.timestamp);
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
    this.time = toDate(this.timestamp);
    this.duration = duration;
  }
}


export class Log {
  id: string;
  traceId: string;
  spanId: string;
  timestamp: number;
  fields: Record<string, string>;
  time: string;

  constructor(obj: any) {
    Object.assign(this, obj);
    this.time = toDate(this.timestamp);
  }
}
