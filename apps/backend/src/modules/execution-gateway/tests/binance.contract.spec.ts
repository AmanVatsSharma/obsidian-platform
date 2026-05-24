/**
 * @file src/modules/execution-gateway/tests/binance.contract.spec.ts
 * @module execution-gateway
 * @description Contract test for Binance execution connector
 * @author BharatERP
 * @created 2026-05-24
 */

import { AppLoggerService } from '../../../shared/logger';
import { BinanceConnector } from '../connectors/binance/binance.connector';
import { assertConnectorContract } from './connector-contract.harness';

describe('BinanceConnector contract', () => {
  it('satisfies canonical connector contract', async () => {
    const connector = new BinanceConnector({ debug: jest.fn(), setContext: jest.fn() } as unknown as AppLoggerService);
    await assertConnectorContract(connector);
  });
});