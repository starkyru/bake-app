import { DataSource } from 'typeorm';

const roles = [
  { name: 'owner', description: 'Business owner with full access', permissions: ['*'], isAdmin: true },
  { name: 'manager', description: 'Store manager', permissions: ['users:read', 'users:write', 'orders:*', 'inventory:*', 'reports:read', 'finance:read'], isAdmin: false },
  { name: 'accountant', description: 'Financial management', permissions: ['finance:*', 'reports:read', 'orders:read'], isAdmin: false },
  { name: 'chef', description: 'Head chef / kitchen manager', permissions: ['recipes:*', 'production:*', 'inventory:read', 'orders:read'], isAdmin: false },
  { name: 'baker', description: 'Baker / pastry chef', permissions: ['recipes:read', 'production:read', 'production:update', 'orders:read'], isAdmin: false },
  { name: 'barista', description: 'Barista / drink preparation', permissions: ['orders:read', 'orders:update', 'recipes:read'], isAdmin: false },
  { name: 'cashier', description: 'POS operator', permissions: ['orders:*', 'products:read', 'categories:read'], isAdmin: false },
  { name: 'warehouse', description: 'Warehouse / inventory management', permissions: ['inventory:*', 'orders:read'], isAdmin: false },
  { name: 'marketing', description: 'Marketing and promotions', permissions: ['products:read', 'reports:read', 'categories:read'], isAdmin: false },
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

// --- Normalized permissions ---

const RESOURCES_WITH_CRUD = [
  'users', 'roles', 'permissions', 'orders', 'products', 'categories',
  'inventory', 'ingredients', 'locations', 'recipes', 'production', 'finance',
];
const RESOURCES_LIMITED: Record<string, string[]> = {
  reports: ['read'],
  notifications: ['read', 'update'],
};

function buildPermissionList(): { resource: string; action: string }[] {
  const perms: { resource: string; action: string }[] = [];
  for (const resource of RESOURCES_WITH_CRUD) {
    for (const action of ['read', 'create', 'update', 'delete']) {
      perms.push({ resource, action });
    }
  }
  for (const [resource, actions] of Object.entries(RESOURCES_LIMITED)) {
    for (const action of actions) {
      perms.push({ resource, action });
    }
  }
  return perms;
}

// Role → permission strings mapping (normalized)
const rolePermissionMap: Record<string, string[]> = {
  // owner is isAdmin, bypasses all checks — no explicit permissions needed
  manager: [
    'users:read', 'users:create', 'users:update',
    'orders:read', 'orders:create', 'orders:update', 'orders:delete',
    'products:read', 'products:create', 'products:update', 'products:delete',
    'categories:read', 'categories:create', 'categories:update', 'categories:delete',
    'inventory:read', 'inventory:create', 'inventory:update', 'inventory:delete',
    'ingredients:read', 'ingredients:create', 'ingredients:update', 'ingredients:delete',
    'locations:read', 'locations:create', 'locations:update',
    'reports:read', 'finance:read',
    'recipes:read', 'production:read',
    'notifications:read', 'notifications:update',
  ],
  cashier: [
    'orders:read', 'orders:create', 'orders:update', 'orders:delete',
    'products:read', 'categories:read',
    'notifications:read', 'notifications:update',
  ],
  chef: [
    'recipes:read', 'recipes:create', 'recipes:update', 'recipes:delete',
    'production:read', 'production:create', 'production:update', 'production:delete',
    'inventory:read', 'ingredients:read', 'orders:read',
    'notifications:read', 'notifications:update',
  ],
  baker: [
    'recipes:read',
    'production:read', 'production:update',
    'orders:read',
    'notifications:read', 'notifications:update',
  ],
  barista: [
    'orders:read', 'orders:update',
    'recipes:read',
    'notifications:read', 'notifications:update',
  ],
  accountant: [
    'finance:read', 'finance:create', 'finance:update', 'finance:delete',
    'reports:read', 'orders:read',
    'notifications:read', 'notifications:update',
  ],
  warehouse: [
    'inventory:read', 'inventory:create', 'inventory:update', 'inventory:delete',
    'ingredients:read', 'ingredients:create', 'ingredients:update', 'ingredients:delete',
    'locations:read', 'orders:read',
    'notifications:read', 'notifications:update',
  ],
  marketing: [
    'products:read', 'categories:read', 'reports:read',
    'notifications:read', 'notifications:update',
  ],
};

export async function seed(dataSource: DataSource): Promise<void> {
  console.log('Starting database seed...');

  // Seed roles
  const roleRepo = dataSource.getRepository('roles');
  for (const role of roles) {
    const existing = await roleRepo.findOne({ where: { name: role.name } });
    if (!existing) {
      await roleRepo.save(roleRepo.create(role));
      console.log(`  Created role: ${role.name}`);
    } else if (existing.isAdmin !== role.isAdmin) {
      existing.isAdmin = role.isAdmin;
      await roleRepo.save(existing);
      console.log(`  Updated role: ${role.name} (isAdmin=${role.isAdmin})`);
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

  // Seed normalized permissions
  const permissionRepo = dataSource.getRepository('permissions');
  const permissionList = buildPermissionList();
  const permissionMap = new Map<string, any>(); // key -> entity

  for (const perm of permissionList) {
    let existing = await permissionRepo.findOne({
      where: { resource: perm.resource, action: perm.action },
    });
    if (!existing) {
      existing = await permissionRepo.save(permissionRepo.create(perm));
      console.log(`  Created permission: ${perm.resource}:${perm.action}`);
    }
    permissionMap.set(`${perm.resource}:${perm.action}`, existing);
  }

  // Seed role-permission mappings
  const rolePermRepo = dataSource.getRepository('role_permissions');
  for (const [roleName, permStrings] of Object.entries(rolePermissionMap)) {
    const role = await roleRepo.findOne({ where: { name: roleName } });
    if (!role) continue;

    const existingCount = await rolePermRepo.count({ where: { roleId: role.id } });
    if (existingCount > 0) continue; // skip if already seeded

    for (const permStr of permStrings) {
      const permEntity = permissionMap.get(permStr);
      if (permEntity) {
        await rolePermRepo.save(
          rolePermRepo.create({ roleId: role.id, permissionId: permEntity.id }),
        );
      }
    }
    console.log(`  Assigned ${permStrings.length} permissions to role: ${roleName}`);
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
