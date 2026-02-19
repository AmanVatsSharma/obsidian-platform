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
import { CommoditiesConnector } from './connectors/commodities/commodities.connector';
import { CryptoCexConnector } from './connectors/crypto-cex/crypto-cex.connector';
import { EquitiesFnoConnector } from './connectors/equities-fno/equities-fno.connector';
import { FxCfdConnector } from './connectors/fx-cfd/fx-cfd.connector';
import { UsEquitiesOptionsConnector } from './connectors/us-equities-options/us-equities-options.connector';
import { ExecutionGatewayController } from './controllers/execution-gateway.controller';
import { ExecutionConnectorEntity } from './entities/execution-connector.entity';
import { ExecutionGatewayService } from './services/execution-gateway.service';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([ExecutionConnectorEntity])],
  controllers: [ExecutionGatewayController],
  providers: [
    ExecutionGatewayService,
    FxCfdConnector,
    EquitiesFnoConnector,
    UsEquitiesOptionsConnector,
    CryptoCexConnector,
    CommoditiesConnector,
  ],
  exports: [ExecutionGatewayService],
})
export class ExecutionGatewayModule {}
