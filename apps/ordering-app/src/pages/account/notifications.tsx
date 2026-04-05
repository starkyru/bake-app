import { useState } from 'react';
import { Bell, Mail, Smartphone, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationPrefs {
  email: boolean;
  sms: boolean;
  push: boolean;
}

interface MenuSubscription {
  id: string;
  menuName: string;
  subscribed: boolean;
}

export function NotificationsPage() {
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    email: true,
    sms: false,
    push: true,
  });

  // Placeholder menu subscriptions
  const [subscriptions, setSubscriptions] = useState<MenuSubscription[]>([
    { id: '1', menuName: 'Daily Specials', subscribed: true },
    { id: '2', menuName: 'Seasonal Menu', subscribed: false },
    { id: '3', menuName: 'Weekend Brunch', subscribed: true },
  ]);

  const togglePref = (key: keyof NotificationPrefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.success('Preference updated');
  };

  const toggleSubscription = (id: string) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, subscribed: !s.subscribed } : s)),
    );
    toast.success('Subscription updated');
  };

  const channels = [
    { key: 'email' as const, label: 'Email Notifications', icon: Mail, description: 'Order updates, promotions' },
    { key: 'sms' as const, label: 'SMS Notifications', icon: Smartphone, description: 'Order status via text' },
    { key: 'push' as const, label: 'Push Notifications', icon: Globe, description: 'Browser notifications' },
  ];

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold" style={{ color: 'var(--color-text)' }}>
        Notifications
      </h2>

      {/* Channels */}
      <div
        className="mb-6 p-4"
        style={{
          borderRadius: 'var(--radius)',
          backgroundColor: 'var(--color-card)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <h3 className="mb-4 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          Notification Channels
        </h3>
        <div className="flex flex-col gap-3">
          {channels.map(({ key, label, icon: Icon, description }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5" style={{ color: 'var(--color-text-muted)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    {label}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {description}
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs[key]}
                onClick={() => togglePref(key)}
                className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors"
                style={{
                  backgroundColor: prefs[key] ? 'var(--color-primary)' : 'rgba(0,0,0,0.15)',
                }}
              >
                <span
                  className="inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
                  style={{
                    transform: prefs[key] ? 'translate(21px, 2px)' : 'translate(2px, 2px)',
                  }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Menu subscriptions */}
      <div
        className="p-4"
        style={{
          borderRadius: 'var(--radius)',
          backgroundColor: 'var(--color-card)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <h3 className="mb-4 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          Menu Subscriptions
        </h3>
        <p className="mb-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Get notified when these menus become available.
        </p>
        <div className="flex flex-col gap-3">
          {subscriptions.map((sub) => (
            <div key={sub.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                <span className="text-sm" style={{ color: 'var(--color-text)' }}>
                  {sub.menuName}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={sub.subscribed}
                onClick={() => toggleSubscription(sub.id)}
                className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors"
                style={{
                  backgroundColor: sub.subscribed
                    ? 'var(--color-primary)'
                    : 'rgba(0,0,0,0.15)',
                }}
              >
                <span
                  className="inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
                  style={{
                    transform: sub.subscribed
                      ? 'translate(21px, 2px)'
                      : 'translate(2px, 2px)',
                  }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
