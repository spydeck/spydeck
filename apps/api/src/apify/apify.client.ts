import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';

const BASE_URL = 'https://api.apify.com';

@Injectable()
export class ApifyClient {
  constructor(
    private readonly config: ConfigService,
    private readonly settings: SettingsService,
  ) {}

  async getApiKey(): Promise<string> {
    const all = await this.settings.findAll();
    const key =
      (all['apifyKey'] as string | undefined) ??
      this.config.get<string>('APIFY_API_KEY');
    if (!key) {
      throw new HttpException(
        'Apify API key not configured. Set apifyKey in settings or APIFY_API_KEY env var.',
        HttpStatus.PRECONDITION_FAILED,
      );
    }
    return key;
  }

  async request<T>(path: string): Promise<T> {
    const apiKey = await this.getApiKey();
    const url = `${BASE_URL}${path}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => res.statusText);
      throw new HttpException(`Apify: ${body}`, res.status);
    }
    return res.json() as Promise<T>;
  }
}
