/**
 * @file src/modules/execution-gateway/execution-gateway.module.ts
 * @module execution-gateway
 * @description Global execution-gateway module with connector family packs
 * @author BharatERP
 * @created 2026-02-17
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '../../shared/shared.module';
import { RbacModule } from '../rbac/rbac.module';
import { CommoditiesConnector } from './connectors/commodities/commodities.connector';
import { CryptoCexConnector } from './connectors/crypto-cex/crypto-cex.connector';
import { EquitiesFnoConnector } from './connectors/equities-fno/equities-fno.connector';
import { FxCfdConnector } from './connectors/fx-cfd/fx-cfd.connector';
import { IbkrConnector } from './connectors/ibkr/ibkr.connector';
import { BinanceConnector } from './connectors/binance/binance.connector';
import { UsEquitiesOptionsConnector } from './connectors/us-equities-options/us-equities-options.connector';
import { KiteExecutionConnector } from './connectors/kite/kite-execution.connector';
import { ExecutionGatewayController } from './controllers/execution-gateway.controller';
import { ExecutionConnectorEntity } from './entities/execution-connector.entity';
import { ExecutionGatewayService } from './services/execution-gateway.service';
import { ExecutionGatewayResolver } from './execution-gateway.resolver';
import { MarketModule } from '../market/market.module';
import { DataProviderEntity } from '../market/entities/data-provider.entity';

@Module({
  imports: [SharedModule, RbacModule, MarketModule, TypeOrmModule.forFeature([ExecutionConnectorEntity, DataProviderEntity])],
  controllers: [ExecutionGatewayController],
  providers: [
    ExecutionGatewayService,
    FxCfdConnector,
    EquitiesFnoConnector,
    UsEquitiesOptionsConnector,
    IbkrConnector,
    CryptoCexConnector,
    BinanceConnector,
    CommoditiesConnector,
    KiteExecutionConnector,
    ExecutionGatewayResolver,
  ],
  exports: [ExecutionGatewayService, KiteExecutionConnector],
})
export class ExecutionGatewayModule {}
