import { useState, useEffect } from 'react';
import { useCustomerProfile, useUpdateCustomerProfile } from '@bake-app/react/api-client';
import { useCustomerAuth } from '@bake-app/react/customer-auth';
import { toast } from 'sonner';

const DIETARY_OPTIONS = [
  'Vegan',
  'Vegetarian',
  'Gluten-Free',
  'Dairy-Free',
  'Nut-Free',
  'Sugar-Free',
  'Keto',
  'Halal',
  'Kosher',
];

const ALLERGY_OPTIONS = [
  'Peanuts',
  'Tree Nuts',
  'Milk',
  'Eggs',
  'Wheat',
  'Soy',
  'Fish',
  'Shellfish',
  'Sesame',
];

interface ProfileData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dietaryPreferences?: string[];
  allergies?: string[];
  notificationPrefs?: { email: boolean; sms: boolean; push: boolean };
}

export function ProfilePage() {
  const { customer } = useCustomerAuth();
  const { data: profileData, isLoading } = useCustomerProfile();
  const updateProfile = useUpdateCustomerProfile();

  const profile = profileData as ProfileData | undefined;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setPhone(profile.phone || '');
      setDietaryPreferences(profile.dietaryPreferences || []);
      setAllergies(profile.allergies || []);
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({
        firstName,
        lastName,
        phone: phone || undefined,
      });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const toggleDietary = (pref: string) => {
    setDietaryPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref],
    );
  };

  const toggleAllergy = (allergy: string) => {
    setAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((a) => a !== allergy) : [...prev, allergy],
    );
  };

  const inputStyle = {
    borderRadius: 'var(--radius)',
    backgroundColor: 'var(--color-card)',
    color: 'var(--color-text)',
    '--tw-ring-color': 'var(--color-primary)',
  } as React.CSSProperties;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold" style={{ color: 'var(--color-text)' }}>
        Profile
      </h2>

      <form onSubmit={handleSave}>
        <div
          className="mb-6 p-4"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-card)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <h3 className="mb-4 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Personal Information
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-11 w-full border border-black/10 px-3 text-sm outline-none focus:ring-2"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-11 w-full border border-black/10 px-3 text-sm outline-none focus:ring-2"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Email
              </label>
              <input
                type="email"
                value={customer?.email ?? ''}
                disabled
                className="h-11 w-full border border-black/10 px-3 text-sm opacity-60"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="h-11 w-full border border-black/10 px-3 text-sm outline-none focus:ring-2"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Dietary preferences */}
        <div
          className="mb-6 p-4"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-card)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Dietary Preferences
          </h3>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((pref) => {
              const active = dietaryPreferences.includes(pref);
              return (
                <button
                  key={pref}
                  type="button"
                  onClick={() => toggleDietary(pref)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: active ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: active ? 'white' : 'var(--color-text-muted)',
                  }}
                >
                  {pref}
                </button>
              );
            })}
          </div>
        </div>

        {/* Allergies */}
        <div
          className="mb-6 p-4"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-card)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Allergies
          </h3>
          <div className="flex flex-wrap gap-2">
            {ALLERGY_OPTIONS.map((allergy) => {
              const active = allergies.includes(allergy);
              return (
                <button
                  key={allergy}
                  type="button"
                  onClick={() => toggleAllergy(allergy)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: active ? '#dc2626' : 'var(--color-surface)',
                    color: active ? 'white' : 'var(--color-text-muted)',
                  }}
                >
                  {allergy}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={updateProfile.isPending}
          className="h-11 w-full font-semibold text-white transition-colors disabled:opacity-50 md:w-auto md:px-8"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-primary)',
          }}
        >
          {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
