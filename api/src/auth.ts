import { CasAuthentication, type Service } from 'finki-auth';

export const casAuthErrorMessage = 'CAS_AUTH_FAILED';

export class AuthManager {
  private readonly activeAuthPromises = new Map<Service, Promise<void>>();
  private readonly casAuth: CasAuthentication;

  constructor(username: string, password: string) {
    this.casAuth = new CasAuthentication({ password, username });
  }

  public async getValidCookieHeader(service: Service): Promise<string> {
    const isValid = await this.casAuth.isCookieValid(service);

    if (!isValid) {
      if (!this.activeAuthPromises.has(service)) {
        const authTask = this.casAuth.authenticate(service).finally(() => {
          this.activeAuthPromises.delete(service);
        });

        this.activeAuthPromises.set(service, authTask);
      }

      await this.activeAuthPromises.get(service);
    }

    const cookies = await this.casAuth.getCookie(service);

    if (cookies.length === 0) {
      throw new Error(casAuthErrorMessage);
    }

    return await this.casAuth.buildCookieHeader(service);
  }
}
