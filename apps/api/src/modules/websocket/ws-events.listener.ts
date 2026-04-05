import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppWebSocketGateway } from './websocket.gateway';
import { DOMAIN_EVENTS, WS_EVENTS, WS_ROOMS } from './ws-events.constants';

@Injectable()
export class WsEventsListener {
  private readonly logger = new Logger(WsEventsListener.name);

  constructor(private gateway: AppWebSocketGateway) {}

  @OnEvent(DOMAIN_EVENTS.ORDER_CREATED)
  handleOrderCreated(payload: any) {
    this.logger.debug(`Order created: ${payload.order?.orderNumber}`);
    this.gateway.emitToRoom(WS_ROOMS.KITCHEN, WS_EVENTS.ORDER_NEW, payload);
    this.gateway.emitToRoom(WS_ROOMS.MANAGER, WS_EVENTS.ORDER_NEW, payload);
  }

  @OnEvent(DOMAIN_EVENTS.ORDER_STATUS_CHANGED)
  handleOrderStatusChanged(payload: any) {
    this.logger.debug(`Order status changed: ${payload.orderNumber} -> ${payload.newStatus}`);
    this.gateway.emitToRoom(WS_ROOMS.KITCHEN, WS_EVENTS.ORDER_STATUS_CHANGED, payload);
    this.gateway.emitToRoom(WS_ROOMS.MANAGER, WS_EVENTS.ORDER_STATUS_CHANGED, payload);
    if (payload.newStatus === 'completed') {
      this.gateway.emitToRoom(WS_ROOMS.POS, WS_EVENTS.ORDER_READY, payload);
    }
  }

  @OnEvent(DOMAIN_EVENTS.ORDER_PAYMENT_RECEIVED)
  handlePaymentReceived(payload: any) {
    this.logger.debug(`Payment received for order: ${payload.orderNumber}`);
    this.gateway.emitToRoom(WS_ROOMS.POS, WS_EVENTS.ORDER_PAYMENT_RECEIVED, payload);
    this.gateway.emitToRoom(WS_ROOMS.MANAGER, WS_EVENTS.ORDER_PAYMENT_RECEIVED, payload);
  }

  @OnEvent(DOMAIN_EVENTS.INVENTORY_DELIVERY)
  @OnEvent(DOMAIN_EVENTS.INVENTORY_WRITE_OFF)
  @OnEvent(DOMAIN_EVENTS.INVENTORY_TRANSFER)
  handleInventoryMovement(payload: any) {
    this.logger.debug(`Inventory movement: ${payload.movementType}`);
    this.gateway.emitToRoom(WS_ROOMS.MANAGER, WS_EVENTS.INVENTORY_UPDATED, payload);
  }

  @OnEvent(DOMAIN_EVENTS.INVENTORY_LOW_STOCK)
  handleLowStock(payload: any) {
    this.logger.debug(`Low stock alert: ${payload.ingredientName}`);
    this.gateway.emitToRoom(WS_ROOMS.KITCHEN, WS_EVENTS.INVENTORY_STOCK_ALERT, payload);
    this.gateway.emitToRoom(WS_ROOMS.MANAGER, WS_EVENTS.INVENTORY_STOCK_ALERT, payload);
  }

  @OnEvent(DOMAIN_EVENTS.PRODUCTION_TASK_UPDATED)
  handleProductionTaskUpdated(payload: any) {
    this.logger.debug(`Production task updated: ${payload.recipeName} -> ${payload.status}`);
    this.gateway.emitToRoom(WS_ROOMS.KITCHEN, WS_EVENTS.PRODUCTION_TASK_UPDATED, payload);
    this.gateway.emitToRoom(WS_ROOMS.MANAGER, WS_EVENTS.PRODUCTION_TASK_UPDATED, payload);
  }

  @OnEvent(DOMAIN_EVENTS.NOTIFICATION_CREATED)
  handleNotificationCreated(payload: any) {
    this.logger.debug(`Notification for user: ${payload.userId}`);
    this.gateway.emitToRoom(
      WS_ROOMS.user(payload.userId),
      WS_EVENTS.NOTIFICATION_NEW,
      payload,
    );
  }

  @OnEvent(DOMAIN_EVENTS.ONLINE_ORDER_CREATED)
  handleOnlineOrderCreated(payload: any) {
    this.logger.debug(`Online order created: ${payload.orderNumber}`);
    this.gateway.emitToRoom(WS_ROOMS.KITCHEN, WS_EVENTS.ONLINE_ORDER_NEW, payload);
    this.gateway.emitToRoom(WS_ROOMS.POS, WS_EVENTS.ONLINE_ORDER_NEW, payload);
  }

  @OnEvent(DOMAIN_EVENTS.ONLINE_ORDER_APPROVAL_NEEDED)
  handleOnlineOrderApprovalNeeded(payload: any) {
    this.logger.debug(`Online order needs approval: ${payload.orderNumber}`);
    this.gateway.emitToRoom(WS_ROOMS.MANAGER, WS_EVENTS.ONLINE_ORDER_APPROVAL_NEEDED, payload);
  }

  @OnEvent(DOMAIN_EVENTS.ONLINE_ORDER_APPROVED)
  handleOnlineOrderApproved(payload: any) {
    this.logger.debug(`Online order approved: ${payload.orderNumber}`);
    this.gateway.emitToRoom(WS_ROOMS.KITCHEN, WS_EVENTS.ONLINE_ORDER_APPROVED, payload);
  }

  @OnEvent(DOMAIN_EVENTS.ONLINE_ORDER_STATUS_CHANGED)
  handleOnlineOrderStatusChanged(payload: any) {
    this.logger.debug(`Online order status changed: ${payload.orderNumber} -> ${payload.newStatus}`);
    this.gateway.emitToRoom(WS_ROOMS.KITCHEN, WS_EVENTS.ONLINE_ORDER_STATUS_CHANGED, payload);
    this.gateway.emitToRoom(WS_ROOMS.MANAGER, WS_EVENTS.ONLINE_ORDER_STATUS_CHANGED, payload);
    this.gateway.emitToRoom(WS_ROOMS.POS, WS_EVENTS.ONLINE_ORDER_STATUS_CHANGED, payload);
  }
}
