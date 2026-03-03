# WebSocket API Documentation

## Overview

The WebSocket system provides real-time event broadcasting from the backend to connected frontend clients. It uses Socket.io over the `@nestjs/platform-socket.io` adapter with JWT authentication on handshake.

**Architecture:** Event-driven with `@nestjs/event-emitter` decoupling services from the WebSocket gateway.

```
Service (PosService, InventoryService, etc.)
  ── emits domain event via EventEmitter2 ──►
WsEventsListener (@OnEvent handlers)
  ── calls gateway.emitToRoom() ──►
AppWebSocketGateway (Socket.io server)
  ── emits to clients in rooms ──►
Frontend apps (POS, Kitchen, Manager, Admin)
```

---

## Connection

### URL
```
ws://localhost:3000
```

### Authentication

JWT token is validated during the Socket.io handshake. The token is extracted from (in priority order):

1. `auth.token` — Socket.io auth object (recommended)
2. `Authorization` header — Bearer token
3. `query.token` — URL query parameter (fallback)

### Connection Example
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: '<jwt-token>' },
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});
```

Invalid or missing tokens result in immediate disconnection.

---

## Rooms

Clients are automatically joined to rooms based on their user role upon connection.

| Room | Auto-joined by Roles | Description |
|------|---------------------|-------------|
| `kitchen` | chef, baker, barista | Kitchen display events |
| `pos` | cashier, barista | Point-of-sale events |
| `manager` | owner, manager | All management events |
| `user:{userId}` | All authenticated users | Personal notifications |

### Manual Room Management

Clients can also manually join/leave rooms:

```javascript
// Join a room
socket.emit('joinRoom', 'kitchen');

// Leave a room
socket.emit('leaveRoom', 'kitchen');
```

---

## Events

### Client ► Server (Inbound)

| Event | Payload | Description |
|-------|---------|-------------|
| `joinRoom` | `string` (room name) | Join a specific room |
| `leaveRoom` | `string` (room name) | Leave a specific room |

### Server ► Client (Outbound)

#### Order Events

| Event | Rooms | Payload | Trigger |
|-------|-------|---------|---------|
| `order:new` | `kitchen`, `manager` | `WsOrderNewPayload` | New order created |
| `order:statusChanged` | `kitchen`, `manager` | `WsOrderStatusPayload` | Order status updated |
| `order:ready` | `pos` | `WsOrderStatusPayload` | Order completed (status = `completed`) |
| `order:paymentReceived` | `pos`, `manager` | `WsOrderPaymentPayload` | Payment added to order |

#### Inventory Events

| Event | Rooms | Payload | Trigger |
|-------|-------|---------|---------|
| `inventory:updated` | `manager` | `WsInventoryUpdatePayload` | Delivery, write-off, or transfer |
| `inventory:stockAlert` | `kitchen`, `manager` | `WsStockAlertPayload` | Item falls to low_stock or out_of_stock |

#### Production Events

| Event | Rooms | Payload | Trigger |
|-------|-------|---------|---------|
| `production:taskUpdated` | `kitchen`, `manager` | `WsProductionTaskPayload` | Task status updated |

#### Notification Events

| Event | Rooms | Payload | Trigger |
|-------|-------|---------|---------|
| `notification:new` | `user:{userId}` | `WsNotificationPayload` | New notification created |

---

## Payload Interfaces

All payload interfaces are available in `@bake-app/shared-types`:

```typescript
import {
  WsOrderNewPayload,
  WsOrderStatusPayload,
  WsOrderPaymentPayload,
  WsInventoryUpdatePayload,
  WsStockAlertPayload,
  WsProductionTaskPayload,
  WsNotificationPayload,
} from '@bake-app/shared-types';
```

### WsOrderNewPayload
```typescript
{
  orderId: string;
  orderNumber: string;
  type: string;         // 'dine_in' | 'takeaway' | 'delivery'
  total: number;
  items: Array<{ productName: string; quantity: number }>;
}
```

### WsOrderStatusPayload
```typescript
{
  orderId: string;
  orderNumber: string;
  previousStatus: string;
  newStatus: string;     // 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
}
```

### WsOrderPaymentPayload
```typescript
{
  orderId: string;
  orderNumber: string;
  paymentId: string;
  amount: number;
  method: string;        // 'cash' | 'card'
}
```

### WsInventoryUpdatePayload
```typescript
{
  movementType: string;  // 'delivery' | 'write_off' | 'transfer'
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  locationId?: string;
}
```

### WsStockAlertPayload
```typescript
{
  ingredientId: string;
  ingredientName: string;
  currentQuantity: number;
  minStockLevel: number;
  status: string;        // 'low_stock' | 'out_of_stock'
  locationId: string;
}
```

### WsProductionTaskPayload
```typescript
{
  taskId: string;
  planId: string;
  recipeName: string;
  status: string;        // 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled'
  actualYield?: number;
  wasteQuantity?: number;
}
```

### WsNotificationPayload
```typescript
{
  notificationId: string;
  type: string;
  title: string;
  message: string;
  priority: string;      // 'low' | 'medium' | 'high' | 'critical'
  userId: string;
}
```

---

## Domain Events (Internal)

These are the internal `@nestjs/event-emitter` events that bridge services to the WebSocket gateway. They are defined in `ws-events.constants.ts`:

| Constant | Value | Emitted By |
|----------|-------|------------|
| `ORDER_CREATED` | `order.created` | `PosService.createOrder()` |
| `ORDER_STATUS_CHANGED` | `order.statusChanged` | `PosService.updateOrderStatus()` |
| `ORDER_PAYMENT_RECEIVED` | `order.paymentReceived` | `PosService.addPayment()` |
| `INVENTORY_DELIVERY` | `inventory.delivery` | `InventoryService.processDelivery()` |
| `INVENTORY_WRITE_OFF` | `inventory.writeOff` | `InventoryService.processWriteOff()` |
| `INVENTORY_TRANSFER` | `inventory.transfer` | `InventoryService.processTransfer()` |
| `INVENTORY_LOW_STOCK` | `inventory.lowStock` | `InventoryService.updateItemStatus()` |
| `PRODUCTION_TASK_UPDATED` | `production.taskUpdated` | `ProductionService.updateTaskStatus()` |
| `NOTIFICATION_CREATED` | `notification.created` | `NotificationsService.create()` |

---

## CORS

The WebSocket gateway accepts connections from all frontend dev servers:
- `http://localhost:4200` (POS)
- `http://localhost:4201` (Admin)
- `http://localhost:4202` (Kitchen)
- `http://localhost:4203` (Manager)
