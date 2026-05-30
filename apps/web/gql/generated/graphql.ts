export type Maybe<T> = T | undefined;
export type InputMaybe<T> = T | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: string; output: string; }
  JSON: { input: unknown; output: unknown; }
  UUID: { input: string; output: string; }
  Void: { input: void; output: void; }
};

export type AccountBalancePayload = {
  __typename?: 'AccountBalancePayload';
  availableCash: Scalars['String']['output'];
  buyingPower: Scalars['String']['output'];
  currency: Scalars['String']['output'];
  equity: Scalars['String']['output'];
  lockedCash: Scalars['String']['output'];
  positionsValue: Scalars['String']['output'];
  totalCash: Scalars['String']['output'];
  unrealizedPnl: Scalars['String']['output'];
};

export type AccountBalanceSnapshotObjectType = {
  __typename?: 'AccountBalanceSnapshotObjectType';
  accountId: Scalars['String']['output'];
  availableCash: Scalars['Float']['output'];
  lockedCash: Scalars['Float']['output'];
  totalCash: Scalars['Float']['output'];
};

export type AccountEntity = {
  __typename?: 'AccountEntity';
  accountId: Scalars['String']['output'];
  accountType?: Maybe<Scalars['String']['output']>;
  broker?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  currency?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  leverage?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  status?: Maybe<Scalars['String']['output']>;
  tenantId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type AlertObjectType = {
  __typename?: 'AlertObjectType';
  createdAt: Scalars['String']['output'];
  dismissedReason?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  instrumentId: Scalars['String']['output'];
  message?: Maybe<Scalars['String']['output']>;
  severity: Scalars['String']['output'];
  status: Scalars['String']['output'];
  tenantId: Scalars['String']['output'];
};

export type AlertsResultObjectType = {
  __typename?: 'AlertsResultObjectType';
  alerts: Array<RiskAlertItem>;
  totalCount: Scalars['Int']['output'];
};

export type ApiKeyObjectType = {
  __typename?: 'ApiKeyObjectType';
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  keyPrefix: Scalars['String']['output'];
  name: Scalars['String']['output'];
  status: Scalars['String']['output'];
  tenantId: Scalars['String']['output'];
};

export type ApiKeyStatusObjectType = {
  __typename?: 'ApiKeyStatusObjectType';
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  expiresAt?: Maybe<Scalars['DateTime']['output']>;
  keyId: Scalars['String']['output'];
  name: Scalars['String']['output'];
  status: Scalars['String']['output'];
};

export type BranchEntity = {
  __typename?: 'BranchEntity';
  brokerId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  status: Scalars['String']['output'];
};

export type BrokerEntity = {
  __typename?: 'BrokerEntity';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  status: Scalars['String']['output'];
  tenantId: Scalars['String']['output'];
};

export type BrokerHierarchyResultObjectType = {
  __typename?: 'BrokerHierarchyResultObjectType';
  branchCount: Scalars['Int']['output'];
  branches: Array<BranchEntity>;
  brokerCount: Scalars['Int']['output'];
  brokers: Array<BrokerEntity>;
  dealerCount: Scalars['Int']['output'];
  dealers: Array<DealerEntity>;
  deskCount: Scalars['Int']['output'];
  desks: Array<DeskEntity>;
};

export type BrokerListResultObjectType = {
  __typename?: 'BrokerListResultObjectType';
  brokers: Array<BrokerEntity>;
  limit: Scalars['Int']['output'];
  offset: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type CancelOrderInput = {
  orderId: Scalars['ID']['input'];
};

export type ChurnRiskScoreObjectType = {
  __typename?: 'ChurnRiskScoreObjectType';
  riskScore: Scalars['Float']['output'];
  userId: Scalars['String']['output'];
};

export type CompliancePolicyObjectType = {
  __typename?: 'CompliancePolicyObjectType';
  amlRiskLevel: Scalars['String']['output'];
  auditRetentionDays: Scalars['Int']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  jurisdictionCode: Scalars['String']['output'];
  kycTier: Scalars['String']['output'];
  sanctionsProvider: Scalars['String']['output'];
  suitabilityRules: Scalars['String']['output'];
  tenantId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export enum ConnectorFamilyEnum {
  Commodities = 'COMMODITIES',
  CryptoCex = 'CRYPTO_CEX',
  EquitiesFno = 'EQUITIES_FNO',
  FxCfd = 'FX_CFD',
  UsEquitiesOptions = 'US_EQUITIES_OPTIONS'
}

export type ConnectorStatusDto = {
  __typename?: 'ConnectorStatusDto';
  accountId?: Maybe<Scalars['String']['output']>;
  clientOrderId?: Maybe<Scalars['String']['output']>;
  connectedAt?: Maybe<Scalars['DateTime']['output']>;
  family: Scalars['String']['output'];
  instrumentId?: Maybe<Scalars['String']['output']>;
  quantity?: Maybe<Scalars['String']['output']>;
  side?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
  tenantId: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type CopyStatsDto = {
  __typename?: 'CopyStatsDto';
  copyPct: Scalars['Float']['output'];
  masterUserId: Scalars['String']['output'];
  realizedPnl: Scalars['Float']['output'];
  slaveUserId: Scalars['String']['output'];
  totalPnl: Scalars['Float']['output'];
  unrealizedPnl: Scalars['Float']['output'];
};

export type CorporateActionEntity = {
  __typename?: 'CorporateActionEntity';
  actionType: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  effectiveDate: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  instrumentId: Scalars['String']['output'];
  recordDate: Scalars['String']['output'];
  status: Scalars['String']['output'];
};

export type CorporateActionInput = {
  actionType: Scalars['String']['input'];
  effectiveDate: Scalars['String']['input'];
  instrumentId: Scalars['String']['input'];
  recordDate?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
};

export type CrmOutreachObjectType = {
  __typename?: 'CrmOutreachObjectType';
  id: Scalars['ID']['output'];
  message?: Maybe<Scalars['String']['output']>;
  sentAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  tenantId: Scalars['String']['output'];
  type: Scalars['String']['output'];
  userId: Scalars['String']['output'];
};

export type CurrentUserDto = {
  __typename?: 'CurrentUserDto';
  tenantId: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
};

export type DashboardExposureObjectType = {
  __typename?: 'DashboardExposureObjectType';
  grossNotional: Scalars['Float']['output'];
  instrumentId: Scalars['String']['output'];
  netNotional: Scalars['Float']['output'];
  netQty: Scalars['Float']['output'];
};

export type DashboardResultObjectType = {
  __typename?: 'DashboardResultObjectType';
  alerts: Array<RiskAlertItem>;
  severity: Scalars['String']['output'];
  totalCount: Scalars['Int']['output'];
};

export type DealObjectType = {
  __typename?: 'DealObjectType';
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  instrumentId: Scalars['String']['output'];
  metadata?: Maybe<Scalars['String']['output']>;
  price: Scalars['Float']['output'];
  quantity: Scalars['Float']['output'];
  side: Scalars['String']['output'];
  status: Scalars['String']['output'];
  tenantId: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

export type DealOverrideResultObjectType = {
  __typename?: 'DealOverrideResultObjectType';
  audit: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  status: Scalars['String']['output'];
};

export type DealStatusObjectType = {
  __typename?: 'DealStatusObjectType';
  dealId: Scalars['String']['output'];
  instrumentId: Scalars['String']['output'];
  metadata?: Maybe<Scalars['String']['output']>;
  price: Scalars['Float']['output'];
  quantity: Scalars['Float']['output'];
  side: Scalars['String']['output'];
  status: Scalars['String']['output'];
};

export type DealerEntity = {
  __typename?: 'DealerEntity';
  createdAt: Scalars['DateTime']['output'];
  deskId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  status: Scalars['String']['output'];
};

export type DemoAccountObjectType = {
  __typename?: 'DemoAccountObjectType';
  accountType: Scalars['String']['output'];
  baseCurrency: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['String']['output'];
  status: Scalars['String']['output'];
  userId: Scalars['String']['output'];
};

export type DeskEntity = {
  __typename?: 'DeskEntity';
  branchId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  status: Scalars['String']['output'];
};

export type EntitlementPlanObjectType = {
  __typename?: 'EntitlementPlanObjectType';
  createdAt: Scalars['DateTime']['output'];
  features: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  limits?: Maybe<Scalars['JSON']['output']>;
  name: Scalars['String']['output'];
};

export type ExposureCheckResultObjectType = {
  __typename?: 'ExposureCheckResultObjectType';
  currentExposure: Scalars['Float']['output'];
  instrumentId: Scalars['String']['output'];
  limit: Scalars['Float']['output'];
  proposedDelta: Scalars['Float']['output'];
  withinLimit: Scalars['Boolean']['output'];
};

export type ExposureLimitObjectType = {
  __typename?: 'ExposureLimitObjectType';
  alertThreshold: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  currentNetExposure: Scalars['String']['output'];
  enabled: Scalars['Boolean']['output'];
  hardLimit: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  instrumentId: Scalars['String']['output'];
  maxNetExposure: Scalars['String']['output'];
  tenantId: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

export type InstrumentDto = {
  __typename?: 'InstrumentDto';
  displayName: Scalars['String']['output'];
  exchangeCode: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  status?: Maybe<Scalars['String']['output']>;
  symbol: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type LimitControlObjectType = {
  __typename?: 'LimitControlObjectType';
  controlType: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  enabled: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  scopeType: Scalars['String']['output'];
  scopeValue: Scalars['String']['output'];
  tenantId: Scalars['String']['output'];
  threshold: Scalars['String']['output'];
};

export type LimitExceptionObjectType = {
  __typename?: 'LimitExceptionObjectType';
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  limitControlId: Scalars['String']['output'];
  metadata?: Maybe<Scalars['String']['output']>;
  reason: Scalars['String']['output'];
  tenantId: Scalars['String']['output'];
};

export type LpProviderObjectType = {
  __typename?: 'LpProviderObjectType';
  apiKey?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  endpoint: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lpType: Scalars['String']['output'];
  name: Scalars['String']['output'];
  priority: Scalars['Int']['output'];
  status: Scalars['String']['output'];
  tenantId: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['String']['output']>;
};

export type LpQuoteTestResultObjectType = {
  __typename?: 'LpQuoteTestResultObjectType';
  provider: Scalars['String']['output'];
  quote: Scalars['Float']['output'];
  testedAt: Scalars['String']['output'];
  validFor: Scalars['Int']['output'];
};

export type ModifyOrderInput = {
  orderId: Scalars['ID']['input'];
  price?: InputMaybe<Scalars['Float']['input']>;
  quantity?: InputMaybe<Scalars['Float']['input']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  activateRule?: Maybe<RuleEntity>;
  addToWatchlist?: Maybe<WatchlistItemDto>;
  announceCorporateAction?: Maybe<CorporateActionEntity>;
  announcePromotion?: Maybe<Scalars['Boolean']['output']>;
  assignRiskPolicy?: Maybe<TenantRiskPolicyObjectType>;
  assignRoleToUser?: Maybe<RoleObjectType>;
  cancelOrder?: Maybe<OrderEntity>;
  createAccount?: Maybe<AccountEntity>;
  createApiKey?: Maybe<ApiKeyObjectType>;
  createBranch?: Maybe<BranchEntity>;
  createBroker?: Maybe<BrokerEntity>;
  createDeal?: Maybe<DealObjectType>;
  createDealer?: Maybe<DealerEntity>;
  createDemoAccount?: Maybe<DemoAccountObjectType>;
  createDesk?: Maybe<DeskEntity>;
  createLimitControl?: Maybe<LimitControlObjectType>;
  createLimitException?: Maybe<LimitExceptionObjectType>;
  createLpProvider?: Maybe<LpProviderObjectType>;
  createOrUpdatePammAllocation?: Maybe<PammSlaveObjectType>;
  createPammMaster?: Maybe<PammMasterObjectType>;
  createPermission?: Maybe<PermissionObjectType>;
  createPromotion?: Maybe<PromotionObjectType>;
  createReport?: Maybe<ReportDefinitionObjectType>;
  createRetentionOffer?: Maybe<RetentionOfferObjectType>;
  createRiskPolicy?: Maybe<RiskPolicyObjectType>;
  createRole?: Maybe<RoleObjectType>;
  createRule?: Maybe<RuleEntity>;
  createSupportTicket?: Maybe<SupportTicketObjectType>;
  createTenant?: Maybe<TenantObjectType>;
  createWatchlist?: Maybe<WatchlistDto>;
  deactivateRule?: Maybe<RuleEntity>;
  deletePermission?: Maybe<PermissionObjectType>;
  deleteRole?: Maybe<RoleObjectType>;
  disableAccount?: Maybe<AccountEntity>;
  dismissRiskAlert?: Maybe<AlertObjectType>;
  enableAccount?: Maybe<AccountEntity>;
  executeReport?: Maybe<ReportExecutionResultObjectType>;
  followStrategy?: Maybe<Scalars['Boolean']['output']>;
  grantPermissionToRole?: Maybe<RoleObjectType>;
  invitePartner?: Maybe<PartnerEntity>;
  markAllAsRead?: Maybe<Scalars['Boolean']['output']>;
  markAsRead?: Maybe<Scalars['Boolean']['output']>;
  modifyOrder?: Maybe<OrderEntity>;
  placeOrder?: Maybe<OrderEntity>;
  processSettlement?: Maybe<SettlementJobEntity>;
  provisionTenant?: Maybe<ProvisioningRequestObjectType>;
  registerWebhookEndpoint?: Maybe<WebhookRegistrationResultObjectType>;
  requestManualOverride?: Maybe<DealOverrideResultObjectType>;
  resolveReconciliationBreak?: Maybe<ReconciliationBreakObjectType>;
  routeOrder?: Maybe<OrderResponseDto>;
  runReconciliation?: Maybe<ReconciliationResultObjectType>;
  sendOutreach?: Maybe<CrmOutreachObjectType>;
  suspendTenant?: Maybe<Scalars['String']['output']>;
  testLpQuote?: Maybe<LpQuoteTestResultObjectType>;
  unfollowStrategy?: Maybe<Scalars['Boolean']['output']>;
  updateExposureLimit?: Maybe<ExposureLimitObjectType>;
  updateLpProvider?: Maybe<LpProviderObjectType>;
  updatePartner?: Maybe<PartnerPayoutResult>;
  updatePermission?: Maybe<PermissionObjectType>;
  updatePromotion?: Maybe<PromotionObjectType>;
  updateRole?: Maybe<RoleObjectType>;
  updateRule?: Maybe<RuleEntity>;
  upsertCompliancePolicy?: Maybe<CompliancePolicyObjectType>;
  upsertEntitlements?: Maybe<EntitlementPlanObjectType>;
  upsertExposureLimit?: Maybe<ExposureLimitObjectType>;
  upsertInstrument?: Maybe<InstrumentDto>;
};


export type MutationCancelOrderArgs = {
  orderId: Scalars['ID']['input'];
};


export type MutationModifyOrderArgs = {
  orderId: Scalars['ID']['input'];
  price?: InputMaybe<Scalars['Float']['input']>;
  quantity?: InputMaybe<Scalars['Float']['input']>;
};


export type MutationPlaceOrderArgs = {
  input: PlaceOrderInput;
};

export type OrderConnection = {
  __typename?: 'OrderConnection';
  data: Array<OrderEntity>;
  limit: Scalars['Int']['output'];
  offset: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type OrderEntity = {
  __typename?: 'OrderEntity';
  accountId: Scalars['ID']['output'];
  algoType?: Maybe<Scalars['String']['output']>;
  clientOrderId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  externalRefId: Scalars['String']['output'];
  filledQty: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  instrumentId: Scalars['ID']['output'];
  orderRole?: Maybe<Scalars['String']['output']>;
  parentOrderId?: Maybe<Scalars['ID']['output']>;
  price?: Maybe<Scalars['Float']['output']>;
  quantity: Scalars['Float']['output'];
  remainingQty: Scalars['Float']['output'];
  side: Scalars['String']['output'];
  slPrice?: Maybe<Scalars['Float']['output']>;
  status: Scalars['String']['output'];
  tenantId: Scalars['String']['output'];
  timeInForce: Scalars['String']['output'];
  tpPrice?: Maybe<Scalars['Float']['output']>;
  triggerCondition?: Maybe<Scalars['String']['output']>;
  triggerPrice?: Maybe<Scalars['Float']['output']>;
  type: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export enum OrderRejectionCode {
  ExchangeNotEnabled = 'EXCHANGE_NOT_ENABLED',
  ExchangeRejected = 'EXCHANGE_REJECTED',
  InsufficientBuyingPower = 'INSUFFICIENT_BUYING_POWER',
  InvalidInstrument = 'INVALID_INSTRUMENT',
  PositionLimitExceeded = 'POSITION_LIMIT_EXCEEDED',
  RiskCheckFailed = 'RISK_CHECK_FAILED',
  Unknown = 'UNKNOWN'
}

export type OrderRejectionError = {
  __typename?: 'OrderRejectionError';
  code: OrderRejectionCode;
  externalRefId?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
};

export type OrderResponseDto = {
  __typename?: 'OrderResponseDto';
  message?: Maybe<Scalars['String']['output']>;
  orderId: Scalars['ID']['output'];
  status: Scalars['String']['output'];
};

export type OrderSnapshotObjectType = {
  __typename?: 'OrderSnapshotObjectType';
  accountId: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  instrumentId: Scalars['String']['output'];
  price?: Maybe<Scalars['Float']['output']>;
  quantity: Scalars['Float']['output'];
  side: Scalars['String']['output'];
  status: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type PammMasterObjectType = {
  __typename?: 'PammMasterObjectType';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  minAllocation: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  performanceFee: Scalars['Float']['output'];
  status: Scalars['String']['output'];
};

export type PammSlaveObjectType = {
  __typename?: 'PammSlaveObjectType';
  allocation: Scalars['Float']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  masterId: Scalars['String']['output'];
  slaveId: Scalars['String']['output'];
  status: Scalars['String']['output'];
};

export type PartnerEntity = {
  __typename?: 'PartnerEntity';
  createdAt: Scalars['String']['output'];
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  status: Scalars['String']['output'];
  tenantId: Scalars['String']['output'];
};

export type PartnerPayoutResult = {
  __typename?: 'PartnerPayoutResult';
  audit?: Maybe<Scalars['String']['output']>;
  partnerId: Scalars['String']['output'];
  status: Scalars['String']['output'];
};

export type PartnerStatusPayload = {
  __typename?: 'PartnerStatusPayload';
  amount: Scalars['Float']['output'];
  currency: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  partnerId: Scalars['ID']['output'];
  reason: Scalars['String']['output'];
  status: Scalars['String']['output'];
};

export type PermissionObjectType = {
  __typename?: 'PermissionObjectType';
  action: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  resource: Scalars['String']['output'];
};

export type PlaceOrderInput = {
  accountId: Scalars['String']['input'];
  clientOrderId?: InputMaybe<Scalars['String']['input']>;
  externalRefId: Scalars['String']['input'];
  instrumentId: Scalars['String']['input'];
  price?: InputMaybe<Scalars['String']['input']>;
  quantity: Scalars['String']['input'];
  side: Scalars['String']['input'];
  slPrice?: InputMaybe<Scalars['String']['input']>;
  timeInForce?: InputMaybe<Scalars['String']['input']>;
  tpPrice?: InputMaybe<Scalars['String']['input']>;
  type: Scalars['String']['input'];
};

export type PositionConnection = {
  __typename?: 'PositionConnection';
  data: Array<PositionRow>;
  limit: Scalars['Int']['output'];
  offset: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type PositionRow = {
  __typename?: 'PositionRow';
  avgPrice: Scalars['Float']['output'];
  instrumentId: Scalars['ID']['output'];
  lastPrice: Scalars['Float']['output'];
  mtmPnl: Scalars['Float']['output'];
  netQty: Scalars['Float']['output'];
  realizedPnl: Scalars['Float']['output'];
  value: Scalars['Float']['output'];
};

export type PositionSnapshotObjectType = {
  __typename?: 'PositionSnapshotObjectType';
  accountId: Scalars['String']['output'];
  instrumentId: Scalars['String']['output'];
  netQty: Scalars['Float']['output'];
};

export type PromotionObjectType = {
  __typename?: 'PromotionObjectType';
  budget: Scalars['Float']['output'];
  createdAt: Scalars['String']['output'];
  endDate: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  spent: Scalars['Float']['output'];
  startDate: Scalars['String']['output'];
  status: Scalars['String']['output'];
  tenantId: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type ProvisioningRequestObjectType = {
  __typename?: 'ProvisioningRequestObjectType';
  code: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  displayName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  planName: Scalars['String']['output'];
  status: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  account?: Maybe<AccountEntity>;
  accountBalance?: Maybe<AccountBalancePayload>;
  adminAudits?: Maybe<Scalars['JSON']['output']>;
  adminOrderAudits?: Maybe<Scalars['String']['output']>;
  adminRevenue?: Maybe<Scalars['String']['output']>;
  adminStats?: Maybe<StatsDto>;
  adminSystemStatus?: Maybe<Scalars['String']['output']>;
  allAccounts?: Maybe<Scalars['String']['output']>;
  apiKeyStatus?: Maybe<ApiKeyStatusObjectType>;
  apiKeys?: Maybe<Scalars['String']['output']>;
  bracketChildren?: Maybe<Scalars['String']['output']>;
  brandConfig?: Maybe<TenantBrandConfigObjectType>;
  brokerHierarchy?: Maybe<BrokerHierarchyResultObjectType>;
  brokers?: Maybe<BrokerListResultObjectType>;
  checkExposureLimit?: Maybe<ExposureCheckResultObjectType>;
  churnRiskScores?: Maybe<Scalars['String']['output']>;
  compliancePolicies?: Maybe<Scalars['String']['output']>;
  connectorStatus?: Maybe<ConnectorStatusDto>;
  connectors?: Maybe<Scalars['String']['output']>;
  copyPositions?: Maybe<Scalars['String']['output']>;
  copyStats?: Maybe<CopyStatsDto>;
  copyStrategies?: Maybe<Scalars['String']['output']>;
  corporateAction?: Maybe<CorporateActionEntity>;
  corporateActions?: Maybe<Scalars['String']['output']>;
  crmOutreachList?: Maybe<Scalars['String']['output']>;
  dealStatus?: Maybe<DealStatusObjectType>;
  deals?: Maybe<Scalars['String']['output']>;
  demoAccounts?: Maybe<Scalars['String']['output']>;
  entitlementPlans?: Maybe<Scalars['String']['output']>;
  exposureLimits?: Maybe<Scalars['String']['output']>;
  instrument?: Maybe<InstrumentDto>;
  instruments: Array<InstrumentDto>;
  limitControls?: Maybe<Scalars['String']['output']>;
  limitExceptions?: Maybe<Scalars['String']['output']>;
  lpProviders?: Maybe<Scalars['String']['output']>;
  me?: Maybe<CurrentUserDto>;
  myAccounts?: Maybe<Scalars['String']['output']>;
  notifications?: Maybe<Scalars['String']['output']>;
  onboardingProfiles?: Maybe<Scalars['String']['output']>;
  order?: Maybe<OrderEntity>;
  orders?: Maybe<OrderConnection>;
  pammMaster?: Maybe<PammMasterObjectType>;
  pammMasters?: Maybe<Scalars['String']['output']>;
  pammSlaves?: Maybe<Scalars['String']['output']>;
  partnerStats?: Maybe<PartnerStatusPayload>;
  partners?: Maybe<Scalars['String']['output']>;
  permission?: Maybe<PermissionObjectType>;
  permissions?: Maybe<Scalars['String']['output']>;
  position?: Maybe<Scalars['String']['output']>;
  positions?: Maybe<PositionConnection>;
  promotions?: Maybe<Scalars['String']['output']>;
  provisioningRequests?: Maybe<Scalars['String']['output']>;
  quote?: Maybe<QuoteDto>;
  realtimeSnapshots?: Maybe<RealtimeSnapshotsResultObjectType>;
  realtimeWatchedSymbols?: Maybe<SubscriptionRegistryObjectType>;
  reconciliationBreaks?: Maybe<Scalars['String']['output']>;
  report?: Maybe<ReportDefinitionObjectType>;
  reports?: Maybe<Scalars['String']['output']>;
  riskAlerts?: Maybe<AlertsResultObjectType>;
  riskDashboard?: Maybe<DashboardResultObjectType>;
  riskPolicies?: Maybe<Scalars['String']['output']>;
  role?: Maybe<RoleObjectType>;
  roles?: Maybe<Scalars['String']['output']>;
  ruleEvaluations?: Maybe<Scalars['String']['output']>;
  rules?: Maybe<Scalars['String']['output']>;
  sessions?: Maybe<Scalars['String']['output']>;
  settlementBatch?: Maybe<Scalars['String']['output']>;
  settlementStats?: Maybe<SettlementStats>;
  settlements?: Maybe<Scalars['String']['output']>;
  supportTickets?: Maybe<Scalars['String']['output']>;
  tenants?: Maybe<Scalars['String']['output']>;
  unreadCount?: Maybe<Scalars['Int']['output']>;
  user?: Maybe<UserDto>;
  users?: Maybe<UserListDto>;
  watchlists: Array<WatchlistDto>;
};


export type QueryAccountArgs = {
  userId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAccountBalanceArgs = {
  accountId?: InputMaybe<Scalars['String']['input']>;
  currency?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAdminAuditsArgs = {
  action?: InputMaybe<Scalars['String']['input']>;
  actor?: InputMaybe<Scalars['String']['input']>;
  from?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  module?: InputMaybe<Scalars['String']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  to?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAdminOrderAuditsArgs = {
  action?: InputMaybe<Scalars['String']['input']>;
  actor?: InputMaybe<Scalars['String']['input']>;
  from?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  module?: InputMaybe<Scalars['String']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  to?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAdminRevenueArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  period?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAdminStatsArgs = {
  from?: InputMaybe<Scalars['String']['input']>;
  period?: InputMaybe<Scalars['String']['input']>;
  to?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAdminSystemStatusArgs = {
  action?: InputMaybe<Scalars['String']['input']>;
  actor?: InputMaybe<Scalars['String']['input']>;
  from?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  module?: InputMaybe<Scalars['String']['input']>;
  to?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAllAccountsArgs = {
  accountId?: InputMaybe<Scalars['String']['input']>;
  currency?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryApiKeyStatusArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};


export type QueryApiKeysArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBrandConfigArgs = {
  code?: InputMaybe<Scalars['String']['input']>;
  displayName?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBrokerHierarchyArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryBrokersArgs = {
  brokerCode?: InputMaybe<Scalars['String']['input']>;
  displayName?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryCheckExposureLimitArgs = {
  instrumentId?: InputMaybe<Scalars['String']['input']>;
  proposedDelta?: InputMaybe<Scalars['Float']['input']>;
};


export type QueryChurnRiskScoresArgs = {
  message?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryCompliancePoliciesArgs = {
  amlRiskLevel?: InputMaybe<Scalars['String']['input']>;
  auditRetentionDays?: InputMaybe<Scalars['Int']['input']>;
  jurisdictionCode?: InputMaybe<Scalars['String']['input']>;
  kycTier?: InputMaybe<Scalars['String']['input']>;
  sanctionsProvider?: InputMaybe<Scalars['String']['input']>;
  suitabilityRules?: InputMaybe<Scalars['String']['input']>;
  tenantId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryConnectorStatusArgs = {
  accountId?: InputMaybe<Scalars['String']['input']>;
  clientOrderId?: InputMaybe<Scalars['String']['input']>;
  family?: InputMaybe<ConnectorFamilyEnum>;
  instrumentId?: InputMaybe<Scalars['String']['input']>;
  quantity?: InputMaybe<Scalars['String']['input']>;
  side?: InputMaybe<ConnectorFamilyEnum>;
  tenantId?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<ConnectorFamilyEnum>;
};


export type QueryConnectorsArgs = {
  family?: InputMaybe<ConnectorFamilyEnum>;
};


export type QueryCopyStatsArgs = {
  copyPct?: InputMaybe<Scalars['String']['input']>;
  masterUserId?: InputMaybe<Scalars['String']['input']>;
  slaveUserId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryCorporateActionArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  input?: InputMaybe<CorporateActionInput>;
};


export type QueryCorporateActionsArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  input?: InputMaybe<CorporateActionInput>;
};


export type QueryDealStatusArgs = {
  instrumentId?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<Scalars['String']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
  quantity?: InputMaybe<Scalars['Float']['input']>;
  side?: InputMaybe<Scalars['String']['input']>;
};


export type QueryDealsArgs = {
  instrumentId?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<Scalars['String']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
  quantity?: InputMaybe<Scalars['Float']['input']>;
  side?: InputMaybe<Scalars['String']['input']>;
};


export type QueryDemoAccountsArgs = {
  baseCurrency?: InputMaybe<Scalars['String']['input']>;
  seedAmount?: InputMaybe<Scalars['Float']['input']>;
  seedBalanceCcy?: InputMaybe<Scalars['String']['input']>;
};


export type QueryExposureLimitsArgs = {
  id?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<UpdateExposureLimitDto>;
};


export type QueryInstrumentArgs = {
  exchange?: InputMaybe<Scalars['String']['input']>;
  symbol?: InputMaybe<Scalars['String']['input']>;
};


export type QueryInstrumentsArgs = {
  exchangeCode?: InputMaybe<Scalars['String']['input']>;
  q?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};


export type QueryLpProvidersArgs = {
  apiKey?: InputMaybe<Scalars['String']['input']>;
  endpoint?: InputMaybe<Scalars['String']['input']>;
  lpType?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  priority?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryMyAccountsArgs = {
  userId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryNotificationsArgs = {
  limit?: InputMaybe<Scalars['String']['input']>;
};


export type QueryOnboardingProfilesArgs = {
  tenantId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryOrderArgs = {
  accountId?: InputMaybe<Scalars['ID']['input']>;
  currency?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryOrdersArgs = {
  accountId?: InputMaybe<Scalars['ID']['input']>;
  from?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  side?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  symbol?: InputMaybe<Scalars['String']['input']>;
  to?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPammMasterArgs = {
  minAllocation?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  performanceFee?: InputMaybe<Scalars['Float']['input']>;
};


export type QueryPammSlavesArgs = {
  minAllocation?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  performanceFee?: InputMaybe<Scalars['Float']['input']>;
  strategyDescription?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPartnerStatsArgs = {
  amount?: InputMaybe<Scalars['Float']['input']>;
  currency?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  partnerId?: InputMaybe<Scalars['ID']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPartnersArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryPermissionArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPermissionsArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPositionArgs = {
  accountId?: InputMaybe<Scalars['ID']['input']>;
  currency?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPositionsArgs = {
  accountId?: InputMaybe<Scalars['ID']['input']>;
  currency?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPromotionsArgs = {
  budget?: InputMaybe<Scalars['Float']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};


export type QueryProvisioningRequestsArgs = {
  code?: InputMaybe<Scalars['String']['input']>;
  displayName?: InputMaybe<Scalars['String']['input']>;
  planName?: InputMaybe<Scalars['String']['input']>;
};


export type QueryQuoteArgs = {
  exchange?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  symbol?: InputMaybe<Scalars['String']['input']>;
};


export type QueryReconciliationBreaksArgs = {
  statementDate?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
};


export type QueryReportArgs = {
  columns?: InputMaybe<Scalars['String']['input']>;
  createdBy?: InputMaybe<Scalars['String']['input']>;
  filters?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};


export type QueryReportsArgs = {
  columns?: InputMaybe<Scalars['String']['input']>;
  createdBy?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};


export type QueryRiskAlertsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  severity?: InputMaybe<Scalars['String']['input']>;
};


export type QueryRiskDashboardArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  severity?: InputMaybe<Scalars['String']['input']>;
};


export type QueryRiskPoliciesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  severity?: InputMaybe<Scalars['String']['input']>;
};


export type QueryRoleArgs = {
  name?: InputMaybe<Scalars['String']['input']>;
};


export type QueryRolesArgs = {
  name?: InputMaybe<Scalars['String']['input']>;
};


export type QuerySettlementBatchArgs = {
  date?: InputMaybe<Scalars['String']['input']>;
};


export type QuerySettlementsArgs = {
  date?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
};


export type QuerySupportTicketsArgs = {
  priority?: InputMaybe<Scalars['String']['input']>;
  subject?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryUserArgs = {
  id?: InputMaybe<Scalars['String']['input']>;
};


export type QueryUsersArgs = {
  limit?: InputMaybe<Scalars['String']['input']>;
  page?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  tenantId?: InputMaybe<Scalars['String']['input']>;
};

export type QuoteDto = {
  __typename?: 'QuoteDto';
  exchange: Scalars['String']['output'];
  price: Scalars['Float']['output'];
  symbol: Scalars['String']['output'];
  ts: Scalars['String']['output'];
};

export type RealtimeSnapshotsResultObjectType = {
  __typename?: 'RealtimeSnapshotsResultObjectType';
  accounts?: Maybe<Array<AccountBalanceSnapshotObjectType>>;
  orders?: Maybe<Array<OrderSnapshotObjectType>>;
  positions?: Maybe<Array<PositionSnapshotObjectType>>;
  watchlist?: Maybe<Array<WatchlistTickObjectType>>;
};

export type ReconciliationBreakObjectType = {
  __typename?: 'ReconciliationBreakObjectType';
  breakType: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isAging: Scalars['Boolean']['output'];
  message?: Maybe<Scalars['String']['output']>;
  priceDiff: Scalars['Float']['output'];
  quantityDiff: Scalars['Float']['output'];
  status: Scalars['String']['output'];
  symbol: Scalars['String']['output'];
  tenantId: Scalars['String']['output'];
};

export type ReconciliationResultObjectType = {
  __typename?: 'ReconciliationResultObjectType';
  breaksFound: Scalars['Int']['output'];
  ranAt: Scalars['String']['output'];
  tradesMatched: Scalars['Int']['output'];
};

export type ReportDefinitionObjectType = {
  __typename?: 'ReportDefinitionObjectType';
  columns: Array<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type ReportExecutionResultObjectType = {
  __typename?: 'ReportExecutionResultObjectType';
  executedAt: Scalars['String']['output'];
  reportId: Scalars['ID']['output'];
  rowCount: Scalars['Int']['output'];
};

export type RetentionOfferObjectType = {
  __typename?: 'RetentionOfferObjectType';
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  offerType: Scalars['String']['output'];
  status: Scalars['String']['output'];
  tenantId: Scalars['String']['output'];
  userId: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type RevenueStatsDto = {
  __typename?: 'RevenueStatsDto';
  monthlyRevenue: Scalars['Float']['output'];
  revenueChange: Scalars['Float']['output'];
  totalRevenue: Scalars['Float']['output'];
};

export type RiskAlertItem = {
  __typename?: 'RiskAlertItem';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  instrumentId?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  severity: Scalars['String']['output'];
};

export type RiskPolicyObjectType = {
  __typename?: 'RiskPolicyObjectType';
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  jurisdictionCode: Scalars['String']['output'];
  maxLeverage: Scalars['String']['output'];
  maxOrderNotional: Scalars['String']['output'];
  policyName: Scalars['String']['output'];
  restrictedProducts: Array<Scalars['String']['output']>;
  sanctionsCheckRequired: Scalars['String']['output'];
  tenantId: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

export type RoleObjectType = {
  __typename?: 'RoleObjectType';
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  permissions: Array<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type RuleEntity = {
  __typename?: 'RuleEntity';
  actions: Scalars['String']['output'];
  conditions: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  enabled: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  triggerEvent: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

export type RuleEvaluationSummary = {
  __typename?: 'RuleEvaluationSummary';
  executionCount: Scalars['Int']['output'];
  lastTriggeredAt?: Maybe<Scalars['String']['output']>;
  ruleId: Scalars['ID']['output'];
  ruleName: Scalars['String']['output'];
  status: Scalars['String']['output'];
  triggerEvent: Scalars['String']['output'];
};

export type SessionDto = {
  __typename?: 'SessionDto';
  createdAt: Scalars['DateTime']['output'];
  deviceInfo?: Maybe<Scalars['String']['output']>;
  expiresAt: Scalars['DateTime']['output'];
  ipAddress?: Maybe<Scalars['String']['output']>;
  lastUsedAt?: Maybe<Scalars['DateTime']['output']>;
  revokedAt?: Maybe<Scalars['DateTime']['output']>;
  tokenId: Scalars['String']['output'];
  userAgent?: Maybe<Scalars['String']['output']>;
};

export type SettlementJobEntity = {
  __typename?: 'SettlementJobEntity';
  amount: Scalars['Float']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  instrumentId: Scalars['String']['output'];
  price: Scalars['Float']['output'];
  quantity: Scalars['Float']['output'];
  settlementDate: Scalars['String']['output'];
  side: Scalars['String']['output'];
  status: Scalars['String']['output'];
  tenantId: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

export type SettlementStats = {
  __typename?: 'SettlementStats';
  failedCount: Scalars['Int']['output'];
  pendingCount: Scalars['Int']['output'];
  processingCount: Scalars['Int']['output'];
  settledCount: Scalars['Int']['output'];
  totalAmount: Scalars['Float']['output'];
  totalJobs: Scalars['Int']['output'];
};

export type StatsDto = {
  __typename?: 'StatsDto';
  activeUsers: Scalars['Int']['output'];
  totalAccounts: Scalars['Int']['output'];
  totalOrders: Scalars['Int']['output'];
  totalUsers: Scalars['Int']['output'];
};

export type SubscriptionRegistryObjectType = {
  __typename?: 'SubscriptionRegistryObjectType';
  watchedSymbols: Array<WatchedSymbolObjectType>;
};

export type SupportTicketObjectType = {
  __typename?: 'SupportTicketObjectType';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  priority: Scalars['String']['output'];
  status: Scalars['String']['output'];
  subject: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  userId: Scalars['String']['output'];
};

export type SystemStatusDto = {
  __typename?: 'SystemStatusDto';
  status: Scalars['String']['output'];
  uptime: Scalars['Float']['output'];
  version: Scalars['String']['output'];
};

export type TenantBrandConfigObjectType = {
  __typename?: 'TenantBrandConfigObjectType';
  code: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  displayName: Scalars['String']['output'];
  logoUrl?: Maybe<Scalars['String']['output']>;
  primaryColor?: Maybe<Scalars['String']['output']>;
  secondaryColor?: Maybe<Scalars['String']['output']>;
};

export type TenantObjectType = {
  __typename?: 'TenantObjectType';
  code: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  displayName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  status: Scalars['String']['output'];
};

export type TenantRiskPolicyObjectType = {
  __typename?: 'TenantRiskPolicyObjectType';
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  riskPolicyId: Scalars['String']['output'];
  scopeType: Scalars['String']['output'];
  scopeValue: Scalars['String']['output'];
  tenantId: Scalars['String']['output'];
};

export type UpdateExposureLimitDto = {
  alertThreshold?: InputMaybe<Scalars['Float']['input']>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  hardLimit?: InputMaybe<Scalars['Float']['input']>;
  maxNetExposure?: InputMaybe<Scalars['Float']['input']>;
};

export type UserDto = {
  __typename?: 'UserDto';
  createdAt: Scalars['DateTime']['output'];
  displayName?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  phone?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
  tenantId: Scalars['String']['output'];
  userId: Scalars['String']['output'];
};

export type UserListDto = {
  __typename?: 'UserListDto';
  limit: Scalars['Int']['output'];
  page: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
  users: Array<UserDto>;
};

export type WatchedSymbolObjectType = {
  __typename?: 'WatchedSymbolObjectType';
  exchange: Scalars['String']['output'];
  symbol: Scalars['String']['output'];
};

export type WatchlistDto = {
  __typename?: 'WatchlistDto';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type WatchlistItemDto = {
  __typename?: 'WatchlistItemDto';
  addedAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  instrumentId: Scalars['ID']['output'];
};

export type WatchlistTickObjectType = {
  __typename?: 'WatchlistTickObjectType';
  ask?: Maybe<Scalars['Float']['output']>;
  bid?: Maybe<Scalars['Float']['output']>;
  exchange: Scalars['String']['output'];
  price: Scalars['Float']['output'];
  symbol: Scalars['String']['output'];
  ts: Scalars['String']['output'];
};

export type WebhookEndpointObjectType = {
  __typename?: 'WebhookEndpointObjectType';
  eventTypes: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  status: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type WebhookRegistrationResultObjectType = {
  __typename?: 'WebhookRegistrationResultObjectType';
  status: Scalars['String']['output'];
  webhook: WebhookEndpointObjectType;
};
