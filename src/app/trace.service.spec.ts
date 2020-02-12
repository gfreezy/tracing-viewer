import {TestBed} from '@angular/core/testing';

import {TraceService} from './trace.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {insertOrUpdate} from './utils/binary-heap';

describe('TraceService', () => {
  let service: TraceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(TraceService);
  });

  it('should insert sorted', () => {
    const d = [1, 2];
    insertOrUpdate(d, 10, (a, b) => a - b);
    insertOrUpdate(d, 3, (a, b) => a - b);
    insertOrUpdate(d, 6, (a, b) => a - b);
    insertOrUpdate(d, 2, (a, b) => a - b);
    insertOrUpdate(d, 9, (a, b) => a - b);
    insertOrUpdate(d, 17, (a, b) => a - b);
    insertOrUpdate(d, 5, (a, b) => a - b);
    expect(d).toEqual([1, 2, 3, 5, 6, 9, 10, 17]);
  });

  it('should update', () => {
    const d = [{a: 1, b: 1}, {a: 2, b: 1}];
    insertOrUpdate(d, {a: 10, b: 1}, (a, b) => a.a - b.a, v => v.b = 3);
    insertOrUpdate(d, {a: 3, b: 1}, (a, b) => a.a - b.a, v => v.b = 3);
    insertOrUpdate(d, {a: 6, b: 1}, (a, b) => a.a - b.a, v => v.b = 3);
    insertOrUpdate(d, {a: 2, b: 1}, (a, b) => a.a - b.a, v => v.b = 3);
    insertOrUpdate(d, {a: 9, b: 1}, (a, b) => a.a - b.a, v => v.b = 3);
    insertOrUpdate(d, {a: 17, b: 1}, (a, b) => a.a - b.a, v => v.b = 3);
    insertOrUpdate(d, {a: 5, b: 1}, (a, b) => a.a - b.a, v => v.b = 3);
    insertOrUpdate(d, {a: 17, b: 1}, (a, b) => a.a - b.a, v => v.b = 3);
    expect(d).toEqual([
      {a: 1, b: 1},
      {a: 2, b: 3},
      {a: 3, b: 1},
      {a: 5, b: 1},
      {a: 6, b: 1},
      {a: 9, b: 1},
      {a: 10, b: 1},
      {a: 17, b: 3}]
    );
  });
});
