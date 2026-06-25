import { Controller, Get } from '@nestjs/common';
import { ScrapeCreatorsAccountService } from './scrapecreators-account.service';

@Controller('scrapecreators/account')
export class ScrapeCreatorsController {
  constructor(private readonly account: ScrapeCreatorsAccountService) {}

  @Get('credit-balance')
  creditBalance() {
    return this.account.creditBalance();
  }

  @Get('request-history')
  requestHistory() {
    return this.account.requestHistory();
  }

  @Get('daily-usage')
  dailyUsage() {
    return this.account.dailyUsage();
  }

  @Get('most-used-routes')
  mostUsedRoutes() {
    return this.account.mostUsedRoutes();
  }
}
