import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';

const BASE_URL = 'https://api.apify.com';

@Injectable()
export class ApifyClient {
  private readonly logger = new Logger(ApifyClient.name);

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
    this.logger.log(`GET ${path}`);
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) {
        const body = await res.text().catch(() => res.statusText);
        this.logger.warn(`Apify ${path} responded ${res.status}: ${body}`);
        throw new HttpException(`Apify: ${body}`, res.status);
      }
      return res.json() as Promise<T>;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.logger.error(`Apify request failed: ${path}`, (err as Error).stack);
      throw err;
    }
  }

  // Runs an actor synchronously and returns its dataset items.
  // actorId uses the `username~actor-name` form, e.g. `harvestapi~linkedin-company-search`.
  async runActor<T>(actorId: string, input: unknown): Promise<T[]> {
    const apiKey = await this.getApiKey();
    const url = `${BASE_URL}/v2/acts/${actorId}/run-sync-get-dataset-items`;
    this.logger.log(`RUN ${actorId}`);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => res.statusText);
        this.logger.warn(
          `Apify run ${actorId} responded ${res.status}: ${body}`,
        );
        throw new HttpException(`Apify: ${body}`, res.status);
      }
      return res.json() as Promise<T[]>;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.logger.error(`Apify run failed: ${actorId}`, (err as Error).stack);
      throw err;
    }
  }
}
