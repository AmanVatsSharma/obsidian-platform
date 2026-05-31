// Generate GraphQL schema from resolver files - with proper return types
const fs = require('fs');
const path = require('path');

const resolversDir = 'apps/backend/src/modules';
const outPath = 'apps/backend/src/generated/schema.gql';

// Get all resolver files
const resolverFiles = [];
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith('.resolver.ts')) resolverFiles.push(full);
  }
}
walk(resolversDir);
console.log('Found', resolverFiles.length, 'resolver files');

// Known return types mapping
// Known scalar mappings — must map all non-Object types
const scalarMap = {
  // Scalars
  String: 'String', Boolean: 'Boolean', Int: 'Int', Float: 'Float', ID: 'ID',
  DateTime: 'DateTime', UUID: 'UUID', JSON: 'JSON', Void: 'Void',
  // Aliases
  GQLID: 'ID', Number: 'Float', Long: 'Float', BigInt: 'Float',
  Object: 'JSON',
  // Object-type aliases (these resolve to the defined types below)
  BrokerObjectType: 'BrokerEntity',
  BranchObjectType: 'BranchEntity',
  DeskObjectType: 'DeskEntity',
  DealerObjectType: 'DealerEntity',
  PlaceOrderResultUnion: 'OrderEntity',
  StatsPayload: 'StatsDto',
};

function mapType(t) {
  return scalarMap[t] || t; // passthrough unknown as-is (Object types)
}

// Track fields for each type
const queryFields = [];
const mutationFields = [];
const typeFields = {};

// Build query/mutation fields with proper types
for (const fp of resolverFiles) {
  const content = fs.readFileSync(fp, 'utf8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim(); // Trim whitespace to handle indentation

    // Parse @Query return type
    if (line.startsWith('@Query(')) {
      // Extract return type: @Query(() => OrderConnection)
      const typeMatch = line.match(/\(\)\s*=>\s*([A-Z]\w+)/);
      const returnType = typeMatch ? typeMatch[1] : 'String';

      // Extract custom name: name: 'orders'
      const nameMatch = line.match(/name:\s*'([^']+)'/);
      const fieldName = nameMatch ? nameMatch[1] : null;

      // Find method first, then extract args from the full range
      let methodLine = -1;
      for (let j = i + 1; j < Math.min(i + 25, lines.length); j++) {
        const nextLine = lines[j].trim();
        // Skip decorators (@Permissions, @UseGuards, etc.) and comments
        if (nextLine.startsWith('//')) continue;
        if (nextLine.startsWith('async ')) {
          methodLine = j;
          break;
        }
        // Don't break on @Annotations — keep searching
      }
      if (methodLine === -1) continue;

      const methodMatch = lines[methodLine].trim().match(/async\s+(\w+)/);
      if (!methodMatch) continue;
      const methodName = methodMatch[1];
      const gqlName = fieldName || methodName;
      const gqlType = mapType(returnType);

      // Extract ALL @Args from the range from after @Query up to and including the method parameter list
      const args = [];
      const searchEnd = Math.min(i + 25, lines.length);
      for (let k = i + 1; k < searchEnd; k++) {
        const argLine = lines[k].trim();
        if (argLine.startsWith('@Args(')) {
          // Capture full multi-line @Args block
          let argBlock = argLine;
          let parenCount = (argBlock.match(/\(/g) || []).length - (argBlock.match(/\)/g) || []).length;
          let m = k + 1;
          while (parenCount > 0 && m < searchEnd) {
            const next = lines[m].trim();
            argBlock += ' ' + next;
            parenCount += (next.match(/\(/g) || []).length - (next.match(/\)/g) || []).length;
            if (parenCount <= 0) break;
            m++;
            // Stop if we hit method parameter lines
            if (argLine.startsWith('@Args(') && next.startsWith('@')) break;
          }
          // Parse: 'name' and type: () => TYPE
          const argNameMatch = argBlock.match(/'([^']+)'/);
          const argTypeMatch = argBlock.match(/type:\s*\(\)\s*=>\s*([A-Z]\w+)/);
          // Default to String for args without explicit type or with inline type like `'BUY' | 'SELL'`
          const argType = argTypeMatch ? mapType(argTypeMatch[1]) : 'String';
          if (argNameMatch) {
            args.push({ name: argNameMatch[1], type: argType });
          }
        }
      }
      // Also scan lines between 'async orders(' and the closing ')'
      // to catch @Args that appear as the first token on each parameter line
      let inMethodParams = false;
      let openParens = 0;
      let openBrackets = 0;
      for (let k = methodLine; k < searchEnd; k++) {
        const l = lines[k].trim();
        if (k === methodLine) {
          inMethodParams = true;
          openParens = (l.match(/\(/g) || []).length;
          continue;
        }
        if (!inMethodParams) continue;
        // Track all bracket types
        openBrackets += (l.match(/\[/g) || []).length;
        openBrackets -= (l.match(/\]/g) || []).length;
        if (l.startsWith('@Args(')) {
          let argBlock = l;
          let parenCount = 1; // already inside the @Args
          let m = k + 1;
          while (parenCount > 0 && m < searchEnd) {
            const next = lines[m].trim();
            argBlock += ' ' + next;
            parenCount += (next.match(/\(/g) || []).length - (next.match(/\)/g) || []).length;
            m++;
          }
          const argNameMatch = argBlock.match(/'([^']+)'/);
          const argTypeMatch = argBlock.match(/type:\s*\(\)\s*=>\s*([A-Z]\w+)/);
          const argType = argTypeMatch ? mapType(argTypeMatch[1]) : 'String';
          if (argNameMatch) {
            if (!args.some(a => a.name === argNameMatch[1])) {
              args.push({ name: argNameMatch[1], type: argType });
            }
          }
        }
        openParens += (l.match(/\(/g) || []).length;
        openParens -= (l.match(/\)/g) || []).length;
        if (openParens <= 0 && openBrackets === 0 && k > methodLine) break;
      }

      // DEBUG
      if (gqlName === 'orders') {
        console.log('DEBUG orders:', JSON.stringify({ gqlName, returnType, gqlType, args: args.slice() }));
      }

      queryFields.push({
        name: gqlName,
        returnType: gqlType,
        args
      });
    }

    // Parse @Mutation return type
    if (line.startsWith('@Mutation(')) {
      const typeMatch = line.match(/\(\)\s*=>\s*([A-Z]\w+)/);
      const returnType = typeMatch ? typeMatch[1] : 'String';
      const nameMatch = line.match(/name:\s*'([^']+)'/);
      const fieldName = nameMatch ? nameMatch[1] : null;
      const nullable = line.includes('nullable: true');
              const gqlType = mapType(returnType);

      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (nextLine.startsWith('@') || nextLine.startsWith('//')) continue;
        if (nextLine.startsWith('async ')) {
          const methodMatch = nextLine.match(/async\s+(\w+)/);
          if (methodMatch) {
            const methodName = methodMatch[1];
            const gqlName = fieldName || methodName;

            // Extract args - match @Args with multi-line support
            const args = [];
            for (let k = i; k < j; k++) {
              const argLine = lines[k].trim();
              // Match @Args(...) including multi-line
              if (argLine.startsWith('@Args(')) {
                // Capture the full @Args block (could span multiple lines)
                let argBlock = argLine;
                let parenCount = (argBlock.match(/\(/g) || []).length - (argBlock.match(/\)/g) || []).length;
                let m = k + 1;
                while (parenCount > 0 && m < lines.length) {
                  const next = lines[m].trim();
                  argBlock += ' ' + next;
                  parenCount += (next.match(/\(/g) || []).length - (next.match(/\)/g) || []).length;
                  if (parenCount <= 0) break;
                  m++;
                }
                // Parse the block
                const argNameMatch = argBlock.match(/'([^']+)'/);
                const argTypeMatch = argBlock.match(/type:\s*\(\)\s*=>\s*([A-Z]\w+)/);
                const argType = argTypeMatch ? mapType(argTypeMatch[1]) : 'String';
                if (argNameMatch) {
                  args.push({ name: argNameMatch[1], type: argType });
                }
              }
            }

            const retType = gqlType;

            mutationFields.push({
              name: gqlName,
              returnType: retType,
              args
            });
          }
          break;
        }
        if (nextLine && !nextLine.startsWith('async') && !nextLine.startsWith('@')) {
          break;
        }
      }
    }
  }
}

console.log('Query fields:', queryFields.length);
console.log('Mutation fields:', mutationFields.length);

// Build schema
let schema = `# GraphQL Schema - Auto-generated from resolver files
# Generated: ${new Date().toISOString()}
# Source: apps/backend/src/modules/**/*.resolver.ts

scalar DateTime
scalar UUID
scalar JSON
scalar Void

type Query {
`;

for (const f of queryFields) {
  const args = f.args.length > 0
    ? `(${f.args.map(a => `${a.name}: ${mapType(a.type)}`).join(', ')})`
    : '';
  schema += `  ${f.name}${args}: ${f.returnType}\n`;
}

schema += `}

type Mutation {
`;

for (const f of mutationFields) {
  const args = f.args.length > 0
    ? `(${f.args.map(a => `${a.name}: ${mapType(a.type)}`).join(', ')})`
    : '';
  schema += `  ${f.name}${args}: ${f.returnType}\n`;
}

// Add type definitions
schema += `}

# Entity Types
type AccountEntity {
  id: ID!
  tenantId: String!
  accountId: String!
  name: String!
  accountType: String
  broker: String
  currency: String
  leverage: String
  status: String
  createdAt: DateTime!
  updatedAt: DateTime!
}

type OrderEntity {
  id: ID!
  tenantId: String!
  accountId: ID!
  instrumentId: ID!
  side: String!
  type: String!
  quantity: Float!
  price: Float
  slPrice: Float
  tpPrice: Float
  timeInForce: String!
  status: String!
  clientOrderId: String!
  externalRefId: String!
  filledQty: Float!
  remainingQty: Float!
  createdAt: DateTime!
  updatedAt: DateTime!
  parentOrderId: ID
  orderRole: String
  triggerPrice: Float
  triggerCondition: String
  algoType: String
}

type InstrumentDto {
  id: ID!
  exchangeCode: String!
  symbol: String!
  displayName: String!
  type: String!
  status: String
}

type WatchlistDto {
  id: ID!
  name: String!
  createdAt: DateTime!
}

type AccountBalancePayload {
  totalCash: String!
  lockedCash: String!
  availableCash: String!
  positionsValue: String!
  unrealizedPnl: String!
  equity: String!
  buyingPower: String!
  currency: String!
}

type CurrentUserDto {
  userId: ID!
  tenantId: String!
}

type SessionDto {
  tokenId: String!
  deviceInfo: String
  ipAddress: String
  userAgent: String
  lastUsedAt: DateTime
  revokedAt: DateTime
  createdAt: DateTime!
  expiresAt: DateTime!
}

type OrderConnection {
  data: [OrderEntity!]!
  total: Int!
  limit: Int!
  offset: Int!
}

type PositionRow {
  instrumentId: ID!
  netQty: Float!
  avgPrice: Float!
  realizedPnl: Float!
  lastPrice: Float!
  mtmPnl: Float!
  value: Float!
}

type PositionConnection {
  data: [PositionRow!]!
  total: Int!
  limit: Int!
  offset: Int!
}

type OrderRejectionError {
  code: OrderRejectionCode!
  message: String!
  externalRefId: String
}

type QuoteDto {
  symbol: String!
  exchange: String!
  price: Float!
  ts: String!
}

type WatchlistItemDto {
  id: ID!
  instrumentId: ID!
  addedAt: DateTime!
}

type SystemStatusDto {
  status: String!
  version: String!
  uptime: Float!
}

type StatsDto {
  totalUsers: Int!
  activeUsers: Int!
  totalAccounts: Int!
  totalOrders: Int!
}

type BrokerEntity {
  id: ID!
  name: String!
  tenantId: String!
  status: String!
  createdAt: DateTime!
}

type BranchEntity {
  id: ID!
  name: String!
  brokerId: String!
  status: String!
  createdAt: DateTime!
}

type DeskEntity {
  id: ID!
  name: String!
  branchId: String!
  status: String!
  createdAt: DateTime!
}

type DealerEntity {
  id: ID!
  name: String!
  deskId: String!
  status: String!
  createdAt: DateTime!
}

type RevenueStatsDto {
  totalRevenue: Float!
  monthlyRevenue: Float!
  revenueChange: Float!
}

# Result / Payload types from resolvers
type BrokerHierarchyResultObjectType {
  brokers: [BrokerEntity!]!
  branches: [BranchEntity!]!
  desks: [DeskEntity!]!
  dealers: [DealerEntity!]!
  brokerCount: Int!
  branchCount: Int!
  deskCount: Int!
  dealerCount: Int!
}

type BrokerListResultObjectType {
  brokers: [BrokerEntity!]!
  total: Int!
  limit: Int!
  offset: Int!
}

type CompliancePolicyObjectType {
  id: ID!
  tenantId: String!
  jurisdictionCode: String!
  kycTier: String!
  amlRiskLevel: String!
  sanctionsProvider: String!
  auditRetentionDays: Int!
  suitabilityRules: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type PammMasterObjectType {
  id: ID!
  name: String!
  minAllocation: Float!
  performanceFee: Float!
  status: String!
  createdAt: DateTime!
}

type PammSlaveObjectType {
  id: ID!
  masterId: String!
  slaveId: String!
  allocation: Float!
  status: String!
  createdAt: DateTime!
}

type PartnerStatusPayload {
  id: ID!
  partnerId: ID!
  status: String!
  amount: Float!
  currency: String!
  reason: String!
}

type ApiKeyStatusObjectType {
  name: String!
  description: String
  keyId: String!
  status: String!
  createdAt: DateTime!
  expiresAt: DateTime
}

type CopyStatsDto {
  masterUserId: String!
  slaveUserId: String!
  copyPct: Float!
  totalPnl: Float!
  realizedPnl: Float!
  unrealizedPnl: Float!
}

type CorporateActionEntity {
  id: ID!
  instrumentId: String!
  actionType: String!
  recordDate: String!
  effectiveDate: String!
  status: String!
  createdAt: DateTime!
}

type DealStatusObjectType {
  instrumentId: String!
  side: String!
  quantity: Float!
  price: Float!
  metadata: String
  status: String!
  dealId: String!
}

type ConnectorStatusDto {
  family: String!
  tenantId: String!
  accountId: String
  instrumentId: String
  side: String
  type: String
  quantity: String
  clientOrderId: String
  status: String!
  connectedAt: DateTime
}

type ExposureCheckResultObjectType {
  instrumentId: String!
  proposedDelta: Float!
  currentExposure: Float!
  limit: Float!
  withinLimit: Boolean!
}

type DashboardResultObjectType {
  severity: String!
  totalCount: Int!
  alerts: [RiskAlertItem!]!
}

type RiskAlertItem {
  id: ID!
  instrumentId: String
  severity: String!
  message: String!
  createdAt: DateTime!
}

type AlertsResultObjectType {
  totalCount: Int!
  alerts: [RiskAlertItem!]!
}

type ReportDefinitionObjectType {
  id: ID!
  name: String!
  type: String!
  createdBy: String!
  columns: [String!]!
  createdAt: DateTime!
}

type RoleObjectType {
  id: ID!
  name: String!
  description: String
  permissions: [String!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type PermissionObjectType {
  id: ID!
  name: String!
  description: String
  resource: String!
  action: String!
  createdAt: DateTime!
}

type TenantBrandConfigObjectType {
  code: String!
  displayName: String!
  logoUrl: String
  primaryColor: String
  secondaryColor: String
  createdAt: DateTime!
}

type UserDto {
  id: ID!
  userId: String!
  tenantId: String!
  email: String!
  displayName: String
  phone: String
  status: String!
  createdAt: DateTime!
}

type UserListDto {
  users: [UserDto!]!
  total: Int!
  page: Int!
  limit: Int!
}

type EntitlementPlanObjectType {
  id: ID!
  name: String!
  features: [String!]!
  limits: JSON
  createdAt: DateTime!
}

type ProvisioningRequestObjectType {
  id: ID!
  code: String!
  displayName: String!
  planName: String!
  status: String!
  createdAt: DateTime!
}

type SupportTicketObjectType {
  id: ID!
  userId: String!
  subject: String!
  priority: String!
  status: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}

# Enums
enum OrderRejectionCode {
  INSUFFICIENT_BUYING_POWER
  INVALID_INSTRUMENT
  EXCHANGE_NOT_ENABLED
  POSITION_LIMIT_EXCEEDED
  RISK_CHECK_FAILED
  EXCHANGE_REJECTED
  UNKNOWN
}

# Input Types
input PlaceOrderInput {
  accountId: String!
  instrumentId: String!
  side: String!
  type: String!
  quantity: String!
  price: String
  slPrice: String
  tpPrice: String
  timeInForce: String
  clientOrderId: String
  externalRefId: String!
}

input CancelOrderInput {
  orderId: ID!
}

input ModifyOrderInput {
  orderId: ID!
  price: Float
  quantity: Float
}
`;

fs.writeFileSync(outPath, schema);
console.log('Schema written to', outPath);
console.log('Lines:', schema.split('\n').length);
console.log('\nSample queries:');
queryFields.slice(0, 10).forEach(f => {
  console.log(`  ${f.name}: ${f.returnType}`);
});