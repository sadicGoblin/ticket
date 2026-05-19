import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AppRatingOption {
  rate: number;
  title: string;
  description: string;
  chips: string[];
}

export interface AppRatingOptionsResponse {
  options: AppRatingOption[];
}

export interface AppRatingSubmitPayload {
  rate: number;
  selected_chips: string[];
  organization_code: string;
}

export interface AppRatingSubmitResponse {
  success: boolean;
  message: string;
  rating: {
    id: number;
    rate: number;
    selected_chips: string[];
    organization: number;
    organization_code: string;
    organization_name: string;
    created: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AppRatingService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getOptions(): Observable<AppRatingOptionsResponse> {
    return this.http.get<AppRatingOptionsResponse>(
      `${this.API_URL}/app-rating/options/`,
    );
  }

  submit(payload: AppRatingSubmitPayload): Observable<AppRatingSubmitResponse> {
    return this.http.post<AppRatingSubmitResponse>(
      `${this.API_URL}/app-rating/submit/`,
      payload,
    );
  }
}
