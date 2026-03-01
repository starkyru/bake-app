import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private notificationRepo: Repository<Notification>,
  ) {}

  async findByUser(userId: string, unreadOnly = false): Promise<Notification[]> {
    const where: any = { userId };
    if (unreadOnly) where.isRead = false;
    return this.notificationRepo.find({ where, order: { createdAt: 'DESC' }, take: 50 });
  }

  async create(data: Partial<Notification>): Promise<Notification> {
    return this.notificationRepo.save(this.notificationRepo.create(data));
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
