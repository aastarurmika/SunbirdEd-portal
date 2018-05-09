import { Injectable } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute, RouterStateSnapshot } from '@angular/router';
import { CacheService } from 'ng2-cache-service';
import * as _ from 'lodash';
interface UrlHistory {
  url: string;
  queryParams?: any;
}
@Injectable()
export class NavigationHelperService {
  /**
   * Stores routing history
   */
  private _history: Array<UrlHistory> = [];
  /**
   * Name used to store previous url in session
   */
  private cacheServiceName = 'previousUrl';
  constructor(private router: Router, public activatedRoute: ActivatedRoute, public cacheService: CacheService) {
  }
  /**
   * Stores routing history
   * @memberof NavigationHelperService
   */
  public storeUrlHistory(): void {
    this.router.events.filter(event => event instanceof NavigationEnd).subscribe((urlAfterRedirects: NavigationEnd) => {
      const queryParams = this.activatedRoute.root.children[this.activatedRoute.root.children.length - 1].snapshot.queryParams;
      const url = urlAfterRedirects.url.split('?')[0];
      let history: UrlHistory;
      if (_.isEmpty(queryParams)) {
        history = {url};
      } else {
        history = {url, queryParams};
      }
      this._history = [...this._history, history];
    });
  }
  /**
   * returns routing history
   */
  get history(): Array<UrlHistory> {
    return this._history;
  }
  /**
   * initialize storeUrlHistory function to store routing history.
   * Add callback function for window.onunload to store previous url.
   */
  initialize() {
    this.storeUrlHistory();
    window.onunload = () => {
      if (this.history[this._history.length - 2]) {
        this.cacheService.set(this.cacheServiceName, this.history[this._history.length - 2]);
      }
    };
  }
  /**
   * returns PreviousUrl
   * 1. First fetches from _history property.
   * 2. From session if _history is not present, for reload case.
   * 3. if both are not present then default home is returned.
   */
  public getPreviousUrl(): UrlHistory {
    const previousUrl = this.history[this._history.length - 2];
    const sessionUrl = this.cacheService.get(this.cacheServiceName);
    if (previousUrl) {
      return previousUrl;
    } else if (sessionUrl) {
      return sessionUrl;
    } else {
      return {url: '/home'};
    }
  }
  navigateToPreviousUrl(defaultUrl: string) {
    const previousUrl = this.getPreviousUrl();
    if (previousUrl.url === '/home') {
      this.router.navigate([defaultUrl]);
    } else {
      if (previousUrl.queryParams) {
        this.router.navigate([previousUrl.url], {queryParams: previousUrl.queryParams});
      } else {
        this.router.navigate([previousUrl.url]);
      }
    }
  }

}
