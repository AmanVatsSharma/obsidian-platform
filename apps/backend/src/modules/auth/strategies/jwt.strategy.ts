/**
 * @file src/modules/auth/strategies/jwt.strategy.ts
 * @module auth
 * @description JWT Passport strategy for access tokens
 * @author BharatERP
 * @created 2025-09-18
 */

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET as string,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, tenantId: payload.tid };
  }
}
