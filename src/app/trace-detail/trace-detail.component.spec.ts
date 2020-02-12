import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TraceDetailComponent } from './trace-detail.component';

describe('TraceDetailComponent', () => {
  let component: TraceDetailComponent;
  let fixture: ComponentFixture<TraceDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TraceDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TraceDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
