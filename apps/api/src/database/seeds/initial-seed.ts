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
  { name: 'Main Bakery', address: '742 Elmwood Dr, Charlotte, NC 28205', type: 'production', phone: '+1 (555) 555-5555' },
  { name: 'City Center Store', address: '1503 Maple Crossing Blvd, Charlotte, NC 28202', type: 'retail', phone: '+1 (555) 555-5556' },
  { name: 'Central Warehouse', address: '8910 Pinehurst Commerce Park, Charlotte, NC 28217', type: 'warehouse', phone: '+1 (555) 555-5557' },
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
  settings: ['read', 'update'],
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

// Role -> permission strings mapping (normalized)
const rolePermissionMap: Record<string, string[]> = {
  // owner is isAdmin, bypasses all checks — no explicit permissions needed
  manager: [
    'users:read', 'users:create', 'users:update', 'users:delete',
    'roles:read',
    'permissions:read',
    'orders:read', 'orders:create', 'orders:update', 'orders:delete',
    'products:read', 'products:create', 'products:update', 'products:delete',
    'categories:read', 'categories:create', 'categories:update', 'categories:delete',
    'inventory:read', 'inventory:create', 'inventory:update', 'inventory:delete',
    'ingredients:read', 'ingredients:create', 'ingredients:update', 'ingredients:delete',
    'locations:read', 'locations:create', 'locations:update', 'locations:delete',
    'reports:read',
    'finance:read', 'finance:create', 'finance:update', 'finance:delete',
    'recipes:read', 'recipes:create', 'recipes:update', 'recipes:delete',
    'production:read', 'production:create', 'production:update', 'production:delete',
    'notifications:read', 'notifications:update',
    'settings:read', 'settings:update',
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

// --- Product seed data ---
const products = [
  // Coffee (4)
  { name: 'Espresso', sku: 'COF-001', price: 3.50, costPrice: 1.20, category: 'Coffee' },
  { name: 'Cappuccino', sku: 'COF-002', price: 4.50, costPrice: 1.60, category: 'Coffee' },
  { name: 'Latte', sku: 'COF-003', price: 4.80, costPrice: 1.70, category: 'Coffee' },
  { name: 'Americano', sku: 'COF-004', price: 3.80, costPrice: 1.30, category: 'Coffee' },
  // Pastries (4)
  { name: 'Croissant', sku: 'PAS-001', price: 3.20, costPrice: 1.10, category: 'Pastries' },
  { name: 'Pain au Chocolat', sku: 'PAS-002', price: 3.80, costPrice: 1.30, category: 'Pastries' },
  { name: 'Cinnamon Roll', sku: 'PAS-003', price: 4.00, costPrice: 1.40, category: 'Pastries' },
  { name: 'Danish Pastry', sku: 'PAS-004', price: 3.50, costPrice: 1.20, category: 'Pastries' },
  // Bread (3)
  { name: 'Sourdough Loaf', sku: 'BRD-001', price: 6.50, costPrice: 2.20, category: 'Bread' },
  { name: 'Baguette', sku: 'BRD-002', price: 4.00, costPrice: 1.40, category: 'Bread' },
  { name: 'Whole Wheat Bread', sku: 'BRD-003', price: 5.50, costPrice: 1.90, category: 'Bread' },
  // Sandwiches (3)
  { name: 'Turkey Club', sku: 'SND-001', price: 8.50, costPrice: 3.20, category: 'Sandwiches' },
  { name: 'Grilled Cheese', sku: 'SND-002', price: 6.50, costPrice: 2.40, category: 'Sandwiches' },
  { name: 'Veggie Wrap', sku: 'SND-003', price: 7.00, costPrice: 2.50, category: 'Sandwiches' },
  // Drinks (3)
  { name: 'Fresh Orange Juice', sku: 'DRK-001', price: 5.00, costPrice: 1.80, category: 'Drinks' },
  { name: 'Hot Chocolate', sku: 'DRK-002', price: 4.50, costPrice: 1.50, category: 'Drinks' },
  { name: 'Iced Tea', sku: 'DRK-003', price: 3.50, costPrice: 1.00, category: 'Drinks' },
  // Desserts (3)
  { name: 'Chocolate Cake Slice', sku: 'DES-001', price: 5.50, costPrice: 2.00, category: 'Desserts' },
  { name: 'Cheesecake Slice', sku: 'DES-002', price: 6.00, costPrice: 2.20, category: 'Desserts' },
  { name: 'Tiramisu', sku: 'DES-003', price: 6.50, costPrice: 2.40, category: 'Desserts' },
];

// --- Ingredient seed data ---
const ingredients = [
  { name: 'Coffee Beans', unit: 'kg', minStockLevel: 5, category: 'beverage' },
  { name: 'Whole Milk', unit: 'l', minStockLevel: 20, category: 'dairy' },
  { name: 'All-Purpose Flour', unit: 'kg', minStockLevel: 25, category: 'dry' },
  { name: 'Unsalted Butter', unit: 'kg', minStockLevel: 5, category: 'dairy' },
  { name: 'Granulated Sugar', unit: 'kg', minStockLevel: 10, category: 'dry' },
  { name: 'Eggs', unit: 'pcs', minStockLevel: 60, category: 'dairy' },
  { name: 'Dark Chocolate', unit: 'kg', minStockLevel: 3, category: 'dry' },
  { name: 'Heavy Cream', unit: 'l', minStockLevel: 5, category: 'dairy' },
  { name: 'Active Dry Yeast', unit: 'kg', minStockLevel: 1, category: 'dry' },
  { name: 'Salt', unit: 'kg', minStockLevel: 3, category: 'dry' },
  { name: 'Vanilla Extract', unit: 'l', minStockLevel: 0.5, category: 'flavoring' },
  { name: 'Cream Cheese', unit: 'kg', minStockLevel: 3, category: 'dairy' },
  { name: 'Cocoa Powder', unit: 'kg', minStockLevel: 2, category: 'dry' },
  { name: 'Olive Oil', unit: 'l', minStockLevel: 2, category: 'oil' },
  { name: 'Cinnamon', unit: 'kg', minStockLevel: 0.5, category: 'spice' },
];

// --- Default settings ---
const defaultSettings = [
  { key: 'bakery_name', value: 'Bake App Bakery', group: 'general' },
  { key: 'bakery_address', value: '742 Elmwood Dr, Charlotte, NC 28205', group: 'general' },
  { key: 'bakery_phone', value: '+1 (555) 555-5555', group: 'general' },
  { key: 'currency', value: 'USD', group: 'general' },
  { key: 'vat_rate', value: '12', group: 'tax' },
  { key: 'tax_included', value: 'true', group: 'tax' },
  { key: 'receipt_header', value: 'Bake App Bakery', group: 'pos' },
  { key: 'receipt_footer', value: 'Thank you for your visit!', group: 'pos' },
  { key: 'auto_print_receipt', value: 'true', group: 'pos' },
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
    const bcrypt = await import('bcryptjs');
    const { randomBytes } = await import('crypto');
    let adminPassword = process.env.ADMIN_SEED_PASSWORD;
    if (!adminPassword) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('ADMIN_SEED_PASSWORD environment variable is required in production');
      }
      adminPassword = randomBytes(16).toString('hex');
      console.warn(`  WARNING: No ADMIN_SEED_PASSWORD set. Using generated password: ${adminPassword}`);
    }
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await userRepo.save(userRepo.create({
      email: 'admin@bakery.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: adminRole,
      isActive: true,
    }));
    console.log(`  Created admin user: admin@bakery.com`);
  }

  // --- Seed products ---
  const productRepo = dataSource.getRepository('products');
  const categoryMap = new Map<string, any>();
  const allCategories = await categoryRepo.find();
  for (const cat of allCategories) {
    categoryMap.set(cat.name, cat);
  }
  const productMap = new Map<string, any>();

  for (const prod of products) {
    const existing = await productRepo.findOne({ where: { sku: prod.sku } });
    if (!existing) {
      const cat = categoryMap.get(prod.category);
      const saved = await productRepo.save(
        productRepo.create({
          name: prod.name,
          sku: prod.sku,
          price: prod.price,
          costPrice: prod.costPrice,
          categoryId: cat?.id,
          isActive: true,
        }),
      );
      productMap.set(prod.name, saved);
      console.log(`  Created product: ${prod.name}`);
    } else {
      productMap.set(prod.name, existing);
    }
  }

  // --- Seed ingredients ---
  const ingredientRepo = dataSource.getRepository('ingredients');
  const ingredientMap = new Map<string, any>();

  for (const ing of ingredients) {
    const existing = await ingredientRepo.findOne({ where: { name: ing.name } });
    if (!existing) {
      const saved = await ingredientRepo.save(
        ingredientRepo.create({
          name: ing.name,
          unit: ing.unit,
          category: ing.category,
          isActive: true,
        }),
      );
      ingredientMap.set(ing.name, saved);
      console.log(`  Created ingredient: ${ing.name}`);
    } else {
      ingredientMap.set(ing.name, existing);
    }
  }

  // --- Seed inventory items (link ingredients to Main Bakery) ---
  const inventoryItemRepo = dataSource.getRepository('inventory_items');
  const mainBakery = await locationRepo.findOne({ where: { name: 'Main Bakery' } });

  if (mainBakery) {
    // Most well-stocked, 2 items low-stock
    const inventoryData = [
      { ingredient: 'Coffee Beans', quantity: 15, status: 'in_stock' },
      { ingredient: 'Whole Milk', quantity: 50, status: 'in_stock' },
      { ingredient: 'All-Purpose Flour', quantity: 60, status: 'in_stock' },
      { ingredient: 'Unsalted Butter', quantity: 12, status: 'in_stock' },
      { ingredient: 'Granulated Sugar', quantity: 25, status: 'in_stock' },
      { ingredient: 'Eggs', quantity: 120, status: 'in_stock' },
      { ingredient: 'Dark Chocolate', quantity: 8, status: 'in_stock' },
      { ingredient: 'Heavy Cream', quantity: 10, status: 'in_stock' },
      { ingredient: 'Active Dry Yeast', quantity: 3, status: 'in_stock' },
      { ingredient: 'Salt', quantity: 5, status: 'in_stock' },
      { ingredient: 'Vanilla Extract', quantity: 1.5, status: 'in_stock' },
      { ingredient: 'Cream Cheese', quantity: 2, status: 'low_stock' },   // low: min is 3
      { ingredient: 'Cocoa Powder', quantity: 1, status: 'low_stock' },    // low: min is 2
      { ingredient: 'Olive Oil', quantity: 4, status: 'in_stock' },
      { ingredient: 'Cinnamon', quantity: 1, status: 'in_stock' },
    ];

    for (const inv of inventoryData) {
      const ing = ingredientMap.get(inv.ingredient);
      if (!ing) continue;

      const existing = await inventoryItemRepo.findOne({
        where: { ingredientId: ing.id, locationId: mainBakery.id },
      });
      if (!existing) {
        await inventoryItemRepo.save(
          inventoryItemRepo.create({
            ingredientId: ing.id,
            locationId: mainBakery.id,
            quantity: inv.quantity,
            status: inv.status,
          }),
        );
        console.log(`  Created inventory: ${inv.ingredient} (${inv.quantity} ${ing.unit})`);
      }
    }
  }

  // --- Seed recipes ---
  const recipeRepo = dataSource.getRepository('recipes');
  const recipeIngredientRepo = dataSource.getRepository('recipe_ingredients');

  const recipesData = [
    {
      name: 'Cappuccino',
      category: 'beverage',
      yieldQuantity: 1,
      yieldUnit: 'cup',
      instructions: '1. Pull espresso shot. 2. Steam milk to 65C. 3. Pour steamed milk over espresso. 4. Create latte art.',
      ingredients: [
        { name: 'Coffee Beans', quantity: 0.018, unit: 'kg' },
        { name: 'Whole Milk', quantity: 0.15, unit: 'l' },
      ],
    },
    {
      name: 'Croissant',
      category: 'pastry',
      yieldQuantity: 12,
      yieldUnit: 'pcs',
      instructions: '1. Make dough with flour, sugar, salt, yeast, milk, butter. 2. Laminate dough (3 folds). 3. Shape into crescents. 4. Proof 2 hours. 5. Bake at 200C for 15 min.',
      ingredients: [
        { name: 'All-Purpose Flour', quantity: 0.5, unit: 'kg' },
        { name: 'Unsalted Butter', quantity: 0.28, unit: 'kg' },
        { name: 'Granulated Sugar', quantity: 0.05, unit: 'kg' },
        { name: 'Active Dry Yeast', quantity: 0.007, unit: 'kg' },
        { name: 'Whole Milk', quantity: 0.15, unit: 'l' },
        { name: 'Salt', quantity: 0.01, unit: 'kg' },
        { name: 'Eggs', quantity: 1, unit: 'pcs' },
      ],
    },
    {
      name: 'Sourdough',
      category: 'bread',
      yieldQuantity: 2,
      yieldUnit: 'loaf',
      instructions: '1. Mix flour, water, salt, starter. 2. Bulk ferment 4-6 hours with stretch and fold. 3. Shape. 4. Cold proof overnight. 5. Bake in dutch oven at 230C for 40 min.',
      ingredients: [
        { name: 'All-Purpose Flour', quantity: 1.0, unit: 'kg' },
        { name: 'Salt', quantity: 0.02, unit: 'kg' },
        { name: 'Olive Oil', quantity: 0.03, unit: 'l' },
      ],
    },
    {
      name: 'Chocolate Cake',
      category: 'dessert',
      yieldQuantity: 12,
      yieldUnit: 'slice',
      instructions: '1. Mix dry ingredients. 2. Cream butter and sugar. 3. Add eggs and vanilla. 4. Alternate dry mix and milk. 5. Bake at 175C for 30 min. 6. Frost with ganache.',
      ingredients: [
        { name: 'All-Purpose Flour', quantity: 0.3, unit: 'kg' },
        { name: 'Granulated Sugar', quantity: 0.35, unit: 'kg' },
        { name: 'Cocoa Powder', quantity: 0.075, unit: 'kg' },
        { name: 'Unsalted Butter', quantity: 0.115, unit: 'kg' },
        { name: 'Eggs', quantity: 3, unit: 'pcs' },
        { name: 'Whole Milk', quantity: 0.24, unit: 'l' },
        { name: 'Dark Chocolate', quantity: 0.2, unit: 'kg' },
        { name: 'Heavy Cream', quantity: 0.2, unit: 'l' },
        { name: 'Vanilla Extract', quantity: 0.005, unit: 'l' },
      ],
    },
    {
      name: 'Cheesecake',
      category: 'dessert',
      yieldQuantity: 12,
      yieldUnit: 'slice',
      instructions: '1. Crush biscuits for crust, mix with melted butter, press into pan. 2. Beat cream cheese, sugar, eggs, vanilla. 3. Pour over crust. 4. Bake at 160C for 50 min. 5. Chill 4+ hours.',
      ingredients: [
        { name: 'Cream Cheese', quantity: 0.9, unit: 'kg' },
        { name: 'Granulated Sugar', quantity: 0.2, unit: 'kg' },
        { name: 'Eggs', quantity: 4, unit: 'pcs' },
        { name: 'Heavy Cream', quantity: 0.15, unit: 'l' },
        { name: 'Vanilla Extract', quantity: 0.01, unit: 'l' },
        { name: 'Unsalted Butter', quantity: 0.1, unit: 'kg' },
        { name: 'All-Purpose Flour', quantity: 0.03, unit: 'kg' },
      ],
    },
  ];

  const recipeMap = new Map<string, any>();
  for (const rData of recipesData) {
    const existing = await recipeRepo.findOne({ where: { name: rData.name } });
    if (!existing) {
      const linkedProduct = productMap.get(
        rData.name === 'Sourdough' ? 'Sourdough Loaf'
        : rData.name === 'Chocolate Cake' ? 'Chocolate Cake Slice'
        : rData.name === 'Cheesecake' ? 'Cheesecake Slice'
        : rData.name,
      );
      const saved = await recipeRepo.save(
        recipeRepo.create({
          name: rData.name,
          category: rData.category,
          yieldQuantity: rData.yieldQuantity,
          yieldUnit: rData.yieldUnit,
          instructions: rData.instructions,
          productId: linkedProduct?.id || null,
          isActive: true,
          currentVersion: 1,
        }),
      );
      recipeMap.set(rData.name, saved);

      // Seed recipe ingredients
      for (const ri of rData.ingredients) {
        const ing = ingredientMap.get(ri.name);
        if (ing) {
          await recipeIngredientRepo.save(
            recipeIngredientRepo.create({
              recipeId: saved.id,
              ingredientId: ing.id,
              ingredientName: ri.name,
              quantity: ri.quantity,
              unit: ri.unit,
            }),
          );
        }
      }
      console.log(`  Created recipe: ${rData.name} (${rData.ingredients.length} ingredients)`);
    } else {
      recipeMap.set(rData.name, existing);
    }
  }

  // --- Seed orders (15 orders over last 7 days) ---
  const orderRepo = dataSource.getRepository('orders');
  const orderItemRepo = dataSource.getRepository('order_items');
  const paymentRepo = dataSource.getRepository('payments');

  const existingOrderCount = await orderRepo.count();
  if (existingOrderCount === 0 && mainBakery) {
    const admin = await userRepo.findOne({ where: { email: 'admin@bakery.com' } });
    const allProducts = await productRepo.find();
    const prodByName = new Map<string, any>();
    for (const p of allProducts) {
      prodByName.set(p.name, p);
    }

    const TAX_RATE = 0.12;
    const now = new Date();

    // Generate 15 orders: 10 completed, 3 in_progress, 2 pending
    const orderSpecs = [
      { daysAgo: 6, status: 'completed', items: ['Cappuccino', 'Croissant'] },
      { daysAgo: 6, status: 'completed', items: ['Latte', 'Pain au Chocolat', 'Cinnamon Roll'] },
      { daysAgo: 5, status: 'completed', items: ['Americano', 'Sourdough Loaf'] },
      { daysAgo: 5, status: 'completed', items: ['Espresso', 'Turkey Club', 'Fresh Orange Juice'] },
      { daysAgo: 4, status: 'completed', items: ['Cappuccino', 'Chocolate Cake Slice', 'Hot Chocolate'] },
      { daysAgo: 3, status: 'completed', items: ['Latte', 'Cheesecake Slice'] },
      { daysAgo: 3, status: 'completed', items: ['Grilled Cheese', 'Iced Tea', 'Danish Pastry'] },
      { daysAgo: 2, status: 'completed', items: ['Americano', 'Baguette'] },
      { daysAgo: 1, status: 'completed', items: ['Cappuccino', 'Croissant', 'Fresh Orange Juice', 'Tiramisu'] },
      { daysAgo: 0, status: 'completed', items: ['Espresso', 'Veggie Wrap'] },
      { daysAgo: 0, status: 'in_progress', items: ['Latte', 'Cinnamon Roll', 'Whole Wheat Bread'] },
      { daysAgo: 0, status: 'in_progress', items: ['Cappuccino', 'Pain au Chocolat'] },
      { daysAgo: 0, status: 'in_progress', items: ['Hot Chocolate', 'Croissant', 'Chocolate Cake Slice'] },
      { daysAgo: 0, status: 'pending', items: ['Americano', 'Turkey Club'] },
      { daysAgo: 0, status: 'pending', items: ['Latte', 'Danish Pastry', 'Cheesecake Slice', 'Iced Tea'] },
    ];

    for (let i = 0; i < orderSpecs.length; i++) {
      const spec = orderSpecs[i];
      const orderDate = new Date(now.getTime() - spec.daysAgo * 24 * 60 * 60 * 1000);
      // Add some hour variation
      orderDate.setHours(8 + (i % 10), (i * 17) % 60, 0, 0);

      let subtotal = 0;
      const orderItems: { productId: string; unitPrice: number; quantity: number; subtotal: number }[] = [];
      for (const itemName of spec.items) {
        const prod = prodByName.get(itemName);
        if (!prod) continue;
        const qty = 1;
        const itemSubtotal = parseFloat(prod.price) * qty;
        subtotal += itemSubtotal;
        orderItems.push({
          productId: prod.id,
          unitPrice: parseFloat(prod.price),
          quantity: qty,
          subtotal: itemSubtotal,
        });
      }

      const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
      const total = Math.round((subtotal + tax) * 100) / 100;

      const order = await orderRepo.save(
        orderRepo.create({
          orderNumber: `ORD-${String(i + 1).padStart(4, '0')}`,
          type: 'dine_in',
          status: spec.status,
          subtotal,
          tax,
          total,
          discount: 0,
          userId: admin?.id,
          locationId: mainBakery.id,
          createdAt: orderDate,
        }),
      );

      for (const oi of orderItems) {
        await orderItemRepo.save(
          orderItemRepo.create({
            orderId: order.id,
            productId: oi.productId,
            unitPrice: oi.unitPrice,
            quantity: oi.quantity,
            subtotal: oi.subtotal,
          }),
        );
      }

      // Create payments for completed orders
      if (spec.status === 'completed') {
        await paymentRepo.save(
          paymentRepo.create({
            orderId: order.id,
            amount: total,
            method: i % 2 === 0 ? 'cash' : 'card',
            status: 'completed',
          }),
        );
      }

      console.log(`  Created order: ${order.orderNumber} (${spec.status}, $${total})`);
    }
  }

  // --- Seed production plans ---
  const productionPlanRepo = dataSource.getRepository('production_plans');
  const productionTaskRepo = dataSource.getRepository('production_tasks');

  const existingPlanCount = await productionPlanRepo.count();
  if (existingPlanCount === 0 && mainBakery) {
    const admin = await userRepo.findOne({ where: { email: 'admin@bakery.com' } });
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    // Yesterday's plan — completed
    const plan1 = await productionPlanRepo.save(
      productionPlanRepo.create({
        date: yesterday,
        status: 'completed',
        notes: 'Regular daily production',
        locationId: mainBakery.id,
        createdById: admin?.id,
      }),
    );
    const plan1Tasks = [
      { recipeName: 'Croissant', recipeId: recipeMap.get('Croissant')?.id, planned: 24, actual: 22, waste: 2, status: 'completed' },
      { recipeName: 'Sourdough', recipeId: recipeMap.get('Sourdough')?.id, planned: 6, actual: 6, waste: 0, status: 'completed' },
      { recipeName: 'Chocolate Cake', recipeId: recipeMap.get('Chocolate Cake')?.id, planned: 2, actual: 2, waste: 0, status: 'completed' },
    ];
    for (const t of plan1Tasks) {
      await productionTaskRepo.save(
        productionTaskRepo.create({
          planId: plan1.id,
          recipeId: t.recipeId,
          recipeName: t.recipeName,
          plannedQuantity: t.planned,
          actualYield: t.actual,
          wasteQuantity: t.waste,
          status: t.status,
          scheduledStart: new Date(yesterday.getTime() + 5 * 60 * 60 * 1000),
          scheduledEnd: new Date(yesterday.getTime() + 10 * 60 * 60 * 1000),
          actualStart: new Date(yesterday.getTime() + 5 * 60 * 60 * 1000),
          actualEnd: new Date(yesterday.getTime() + 10 * 60 * 60 * 1000),
        }),
      );
    }
    console.log(`  Created production plan: yesterday (completed, ${plan1Tasks.length} tasks)`);

    // Today's plan — in_progress
    const plan2 = await productionPlanRepo.save(
      productionPlanRepo.create({
        date: today,
        status: 'in_progress',
        notes: 'Morning production run',
        locationId: mainBakery.id,
        createdById: admin?.id,
      }),
    );
    const plan2Tasks = [
      { recipeName: 'Croissant', recipeId: recipeMap.get('Croissant')?.id, planned: 36, actual: 24, waste: 1, status: 'in_progress' },
      { recipeName: 'Cheesecake', recipeId: recipeMap.get('Cheesecake')?.id, planned: 3, actual: null, waste: 0, status: 'pending' },
      { recipeName: 'Sourdough', recipeId: recipeMap.get('Sourdough')?.id, planned: 8, actual: 8, waste: 0, status: 'completed' },
      { recipeName: 'Chocolate Cake', recipeId: recipeMap.get('Chocolate Cake')?.id, planned: 3, actual: null, waste: 0, status: 'pending' },
    ];
    for (const t of plan2Tasks) {
      await productionTaskRepo.save(
        productionTaskRepo.create({
          planId: plan2.id,
          recipeId: t.recipeId,
          recipeName: t.recipeName,
          plannedQuantity: t.planned,
          actualYield: t.actual,
          wasteQuantity: t.waste,
          status: t.status,
          scheduledStart: new Date(today.getTime() + 5 * 60 * 60 * 1000),
          scheduledEnd: new Date(today.getTime() + 12 * 60 * 60 * 1000),
          actualStart: t.status !== 'pending' ? new Date(today.getTime() + 5 * 60 * 60 * 1000) : null,
          actualEnd: t.status === 'completed' ? new Date(today.getTime() + 9 * 60 * 60 * 1000) : null,
        }),
      );
    }
    console.log(`  Created production plan: today (in_progress, ${plan2Tasks.length} tasks)`);
  }

  // --- Seed default settings ---
  const settingRepo = dataSource.getRepository('settings');
  for (const s of defaultSettings) {
    const existing = await settingRepo.findOne({ where: { key: s.key } });
    if (!existing) {
      await settingRepo.save(settingRepo.create(s));
      console.log(`  Created setting: ${s.key} = ${s.value}`);
    }
  }

  console.log('Seed completed.');
}
