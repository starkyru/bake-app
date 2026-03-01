import { DataSource } from 'typeorm';

const roles = [
  { name: 'owner', description: 'Business owner with full access', permissions: ['*'] },
  { name: 'manager', description: 'Store manager', permissions: ['users:read', 'users:write', 'orders:*', 'inventory:*', 'reports:read', 'finance:read'] },
  { name: 'accountant', description: 'Financial management', permissions: ['finance:*', 'reports:read', 'orders:read'] },
  { name: 'chef', description: 'Head chef / kitchen manager', permissions: ['recipes:*', 'production:*', 'inventory:read', 'orders:read'] },
  { name: 'baker', description: 'Baker / pastry chef', permissions: ['recipes:read', 'production:read', 'production:update', 'orders:read'] },
  { name: 'barista', description: 'Barista / drink preparation', permissions: ['orders:read', 'orders:update', 'recipes:read'] },
  { name: 'cashier', description: 'POS operator', permissions: ['orders:*', 'products:read', 'categories:read'] },
  { name: 'warehouse', description: 'Warehouse / inventory management', permissions: ['inventory:*', 'orders:read'] },
  { name: 'marketing', description: 'Marketing and promotions', permissions: ['products:read', 'reports:read', 'categories:read'] },
];

const locations = [
  { name: 'Main Bakery', address: 'Almaty, Abay Ave 10', type: 'production', phone: '+7 727 123 4567' },
  { name: 'City Center Store', address: 'Almaty, Dostyk Ave 85', type: 'retail', phone: '+7 727 234 5678' },
  { name: 'Central Warehouse', address: 'Almaty, Industrial Zone 5', type: 'warehouse', phone: '+7 727 345 6789' },
];

const categories = [
  { name: 'Coffee', sortOrder: 1 },
  { name: 'Pastries', sortOrder: 2 },
  { name: 'Bread', sortOrder: 3 },
  { name: 'Sandwiches', sortOrder: 4 },
  { name: 'Drinks', sortOrder: 5 },
  { name: 'Desserts', sortOrder: 6 },
];

export async function seed(dataSource: DataSource): Promise<void> {
  console.log('Starting database seed...');

  // Seed roles
  const roleRepo = dataSource.getRepository('roles');
  for (const role of roles) {
    const existing = await roleRepo.findOne({ where: { name: role.name } });
    if (!existing) {
      await roleRepo.save(roleRepo.create(role));
      console.log(`  Created role: ${role.name}`);
    }
  }

  // Seed locations
  const locationRepo = dataSource.getRepository('locations');
  for (const location of locations) {
    const existing = await locationRepo.findOne({ where: { name: location.name } });
    if (!existing) {
      await locationRepo.save(locationRepo.create(location));
      console.log(`  Created location: ${location.name}`);
    }
  }

  // Seed categories
  const categoryRepo = dataSource.getRepository('categories');
  for (const category of categories) {
    const existing = await categoryRepo.findOne({ where: { name: category.name } });
    if (!existing) {
      await categoryRepo.save(categoryRepo.create(category));
      console.log(`  Created category: ${category.name}`);
    }
  }

  // Seed admin user
  const userRepo = dataSource.getRepository('users');
  const adminRole = await roleRepo.findOne({ where: { name: 'owner' } });
  const existingAdmin = await userRepo.findOne({ where: { email: 'admin@bakery.com' } });
  if (!existingAdmin && adminRole) {
    // bcryptjs hash for 'admin123'
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash('admin123', 10);
    await userRepo.save(userRepo.create({
      email: 'admin@bakery.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: adminRole,
      isActive: true,
    }));
    console.log('  Created admin user: admin@bakery.com / admin123');
  }

  console.log('Seed completed.');
}
