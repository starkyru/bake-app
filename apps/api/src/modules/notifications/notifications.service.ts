import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Notification } from './entities/notification.entity';
import { DOMAIN_EVENTS } from '../websocket/ws-events.constants';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private notificationRepo: Repository<Notification>,
    private eventEmitter: EventEmitter2,
  ) {}

  async findByUser(userId: string, unreadOnly = false): Promise<Notification[]> {
    const where: any = { userId };
    if (unreadOnly) where.isRead = false;
    return this.notificationRepo.find({ where, order: { createdAt: 'DESC' }, take: 50 });
  }

  async create(data: Partial<Notification>): Promise<Notification> {
    const saved = await this.notificationRepo.save(this.notificationRepo.create(data));
    this.eventEmitter.emit(DOMAIN_EVENTS.NOTIFICATION_CREATED, {
      notificationId: saved.id,
      type: saved.type,
      title: saved.title,
      message: saved.message,
      priority: saved.priority,
      userId: saved.userId,
    });
    return saved;
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({ where: { id, userId } });
    if (!notification) throw new NotFoundException('Notification not found');
    notification.isRead = true;
    return this.notificationRepo.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.update({ userId, isRead: false }, { isRead: true });
  }
}
