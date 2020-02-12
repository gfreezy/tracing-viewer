import {Component, OnInit} from '@angular/core';
import {Span, TraceService} from '../trace.service';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-trace-list',
  templateUrl: './trace-list.component.html',
  styleUrls: ['./trace-list.component.scss']
})
export class TraceListComponent implements OnInit {
  spans: Observable<Span[]>;

  constructor(private traceService: TraceService) {
  }

  ngOnInit(): void {
    this.spans = this.traceService.listTopSpans().pipe(
      map(spans => spans.reverse())
    );
  }
}
