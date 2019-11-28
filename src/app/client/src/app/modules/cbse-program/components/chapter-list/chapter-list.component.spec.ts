import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChapterListComponent } from './chapter-list.component';
import { TelemetryModule } from '@sunbird/telemetry';
import {
  ResourceService, ToasterService, SharedModule, ConfigService, UtilService, BrowserCacheTtlService
} from '@sunbird/shared';
import { CoreModule, ActionService, UserService, PublicDataService } from '@sunbird/core';
import { RouterTestingModule } from '@angular/router/testing';
import { of as observableOf, throwError as observableError, of } from 'rxjs';
import { SuiModule } from 'ng2-semantic-ui/dist';

import { role, selectedAttributes, responseSample, fetchedQueCount, chapterlistSample, textbookMeta } from './chapter-list.component.data';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

describe('ChapterListComponent', () => {
  let component: ChapterListComponent;
  let fixture: ComponentFixture<ChapterListComponent>;
  let errorInitiate, de: DebugElement;
  const actionServiceStub = {
    get() {
      if (errorInitiate) {
        return observableError({ result: { responseCode: 404 } });
      } else {
        return observableOf(responseSample);
      }
    }
  };

  const activatedRouteStub = {
    data: of({
      config: {
        question_categories: [
          'vsa',
          'sa',
          'la',
          'mcq'
        ]
      }
    })
  };

  const UserServiceStub = {
    userid: '874ed8a5-782e-4f6c-8f36-e0288455901e'
  };
  const PublicDataServiceStub = {
    post() {
      return observableOf(fetchedQueCount);
    }
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [TelemetryModule, SharedModule.forRoot(), CoreModule, RouterTestingModule, TelemetryModule.forRoot(), SuiModule],
      declarations: [ChapterListComponent],
      providers: [{ provide: ActionService, useValue: actionServiceStub }, { provide: UserService, useValue: UserServiceStub },
      { provide: PublicDataService, useValue: PublicDataServiceStub }, ToasterService,
      {
        provide: ActivatedRoute, useValue: activatedRouteStub
      }]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChapterListComponent);
    component = fixture.componentInstance;
    de = fixture.debugElement;
    component.role = role;
    component.selectedAttributes = selectedAttributes;
    errorInitiate = false;
    fixture.detectChanges();
  });

  it('should execute getCollectionHierarchy on initialization of component', () => {
    spyOn(component, 'getCollectionHierarchy');
    component.ngOnInit();
    expect(component.getCollectionHierarchy).toHaveBeenCalledWith(selectedAttributes.textbook);
  });

  it('should call showChapterList on successfully collecting textBookMetaData', () => {
    component.selectedAttributes.currentRole = 'REVIEWER';
    fixture.detectChanges();
    spyOn(component, 'showChapterList');
    component.getCollectionHierarchy(selectedAttributes.textbook);
    expect(component.showChapterList).toHaveBeenCalled();
  });

  it('should call showChapterList with role  CONTRIBUTOR', () => {
    component.selectedAttributes.currentRole = 'CONTRIBUTOR';
    fixture.detectChanges();
    spyOn(component, 'showChapterList');
    component.getCollectionHierarchy(selectedAttributes.textbook);
    expect(component.showChapterList).toHaveBeenCalled();
  });

  it('should call showChapterList with role  PUBLISHER', () => {
    component.selectedAttributes.currentRole = 'PUBLISHER';
    fixture.detectChanges();
    spyOn(component, 'showChapterList');
    component.getCollectionHierarchy(selectedAttributes.textbook);
    expect(component.showChapterList).toHaveBeenCalled();
  });

  it('should throw error Fetching TextBook details failed', () => {
    errorInitiate = true;
    spyOn(component.toasterService, 'error');
    component.getCollectionHierarchy(selectedAttributes.textbook);
    expect(component.toasterService.error).toHaveBeenCalledWith('Fetching TextBook details failed');
  });

  xit('should emit click event on click of chapterlist row', async () => {
    spyOn(component, 'emitQuestionTypeTopic');
    component.showLoader = false;
    component.showError = false;
    component.textBookChapters = chapterlistSample;
    fixture.detectChanges();
    const tableRow = de.nativeElement.querySelector('tr:nth-child(2)');
    tableRow.click();
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      expect(component.emitQuestionTypeTopic).toHaveBeenCalled();
    });
  });
  it('should execute ngOnChanges', () => {
    const changed = { selectedSchool: { currentValue: 'newOne', previousValue: 'oldOne' } };
    spyOn(component, 'ngOnChanges').and.callThrough();
    spyOn(component, 'showChapterList');
    this.textbookMeta = [{ test: 1 }];
    component.ngOnChanges(changed);
    expect(component.showChapterList).toHaveBeenCalled();
    expect(component.showChapterList).toHaveBeenCalledTimes(1);
    expect(component.showChapterList).toHaveBeenCalledWith([{ test: 1 }]);
    expect(component.selectedAttributes.selectedSchoolForReview).toEqual('newOne');
  });

  it('should execute ngOnChanges without break if selectedSchool is not changed', () => {
    const changed = {};
    spyOn(component, 'ngOnChanges').and.callThrough();
    spyOn(component, 'showChapterList');
    component.getCollectionHierarchy(selectedAttributes.textbook);
    component.ngOnChanges(changed);
    expect(component.showChapterList).toHaveBeenCalled();
  });

  it('should throw error on failure of apiRequest', () => {
    component.selectedAttributes.currentRole = 'unknown';
    fixture.detectChanges();
    spyOn(component.toasterService, 'error');
    component.showChapterList(textbookMeta);
    expect(component.toasterService.error).toHaveBeenCalledWith('You don\'t have permission to access this page');
  });

});
