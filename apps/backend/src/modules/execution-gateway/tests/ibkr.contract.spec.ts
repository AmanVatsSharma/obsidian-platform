/**
 * @file src/modules/execution-gateway/tests/ibkr.contract.spec.ts
 * @module execution-gateway
 * @description Contract test for IBKR execution connector
 * @author BharatERP
 * @created 2026-05-24
 */

import { AppLoggerService } from '../../../shared/logger';
import { IbkrConnector } from '../connectors/ibkr/ibkr.connector';
import { assertConnectorContract } from './connector-contract.harness';

describe('IbkrConnector contract', () => {
  it('satisfies canonical connector contract', async () => {
    const connector = new IbkrConnector({ debug: jest.fn(), setContext: jest.fn() } as unknown as AppLoggerService);
    await assertConnectorContract(connector);
  });
});