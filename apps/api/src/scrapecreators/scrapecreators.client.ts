import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';

const BASE_URL = 'https://api.scrapecreators.com';

export type Params = Record<string, string | number | boolean | undefined | null>;

@Injectable()
export class ScrapeCreatorsClient {
  constructor(
    private readonly config: ConfigService,
    private readonly settings: SettingsService,
  ) {}

  async getApiKey(): Promise<string> {
    const all = await this.settings.findAll();
    const key =
      (all['scrapeCreatorsKey'] as string | undefined) ??
      this.config.get<string>('SCRAPECREATORS_API_KEY');
    if (!key) {
      throw new HttpException(
        'ScrapeCreators API key not configured. Set scrapeCreatorsKey in settings or SCRAPECREATORS_API_KEY env var.',
        HttpStatus.PRECONDITION_FAILED,
      );
    }
    return key;
  }

  async request<T>(path: string, params: Params = {}): Promise<T> {
    const apiKey = await this.getApiKey();
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) qs.set(k, String(v));
    }
    const url = `${BASE_URL}${path}${qs.size ? '?' + qs.toString() : ''}`;
    const res = await fetch(url, { headers: { 'x-api-key': apiKey } });
    if (!res.ok) {
      const body = await res.text().catch(() => res.statusText);
      throw new HttpException(`ScrapeCreators: ${body}`, res.status);
    }
    return res.json() as Promise<T>;
  }
}
