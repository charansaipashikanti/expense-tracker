import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import User from '../src/models/User';
import Group from '../src/models/Group';
import GroupMember from '../src/models/GroupMember';
import Expense from '../src/models/Expense';
import ExpenseSplit from '../src/models/ExpenseSplit';
import Settlement from '../src/models/Settlement';
import MonthlyRent from '../src/models/MonthlyRent';
import Budget from '../src/models/Budget';

const MONGODB_URI = process.env.MONGODB_URI!;

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Group.deleteMany({}),
      GroupMember.deleteMany({}),
      Expense.deleteMany({}),
      ExpenseSplit.deleteMany({}),
      Settlement.deleteMany({}),
      MonthlyRent.deleteMany({}),
      Budget.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Create users
    const admin = await User.create({
      name: 'Super Admin',
      email: process.env.SUPER_ADMIN_EMAIL || 'admin@roomexpense.app',
      password: process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456',
      role: 'superadmin',
    });

    const charan = await User.create({
      name: 'Charan',
      email: 'charan@example.com',
      password: 'password123',
    });

    const rahul = await User.create({
      name: 'Rahul',
      email: 'rahul@example.com',
      password: 'password123',
    });

    const kiran = await User.create({
      name: 'Kiran',
      email: 'kiran@example.com',
      password: 'password123',
    });

    console.log('👥 Created users:', [admin.name, charan.name, rahul.name, kiran.name].join(', '));

    // Create group
    const group = await Group.create({
      name: 'Room A - Bachelors Pad',
      description: 'Shared apartment expenses',
      currency: 'INR',
      createdBy: charan._id,
    });

    // Add members
    await GroupMember.create([
      { groupId: group._id, userId: charan._id, role: 'admin' },
      { groupId: group._id, userId: rahul._id, role: 'member', addedBy: charan._id },
      { groupId: group._id, userId: kiran._id, role: 'member', addedBy: charan._id },
    ]);

    console.log('🏠 Created group:', group.name);

    // Set monthly rent
    const currentDate = new Date();
    const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const rentPerPerson = 4000;

    await MonthlyRent.create({
      groupId: group._id,
      amount: 12000,
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
      monthKey,
      splitAmounts: [
        { userId: charan._id, amount: rentPerPerson },
        { userId: rahul._id, amount: rentPerPerson },
        { userId: kiran._id, amount: rentPerPerson },
      ],
      createdBy: charan._id,
    });

    console.log('🏡 Set rent: ₹12,000/month');

    // Set budgets
    await Budget.create([
      { groupId: group._id, category: 'groceries', amount: 6000, month: currentDate.getMonth() + 1, year: currentDate.getFullYear(), monthKey, createdBy: charan._id },
      { groupId: group._id, category: 'electricity', amount: 1500, month: currentDate.getMonth() + 1, year: currentDate.getFullYear(), monthKey, createdBy: charan._id },
      { groupId: group._id, category: 'internet', amount: 1000, month: currentDate.getMonth() + 1, year: currentDate.getFullYear(), monthKey, createdBy: charan._id },
      { groupId: group._id, category: 'gas', amount: 800, month: currentDate.getMonth() + 1, year: currentDate.getFullYear(), monthKey, createdBy: charan._id },
    ]);

    console.log('📊 Set budgets');

    // Create sample expenses
    const expenses = [
      { title: 'Monthly Groceries', amount: 4500, category: 'groceries', paidBy: charan._id, splitType: 'equal' },
      { title: 'Electricity Bill', amount: 1200, category: 'electricity', paidBy: rahul._id, splitType: 'equal' },
      { title: 'Internet Bill', amount: 999, category: 'internet', paidBy: kiran._id, splitType: 'equal' },
      { title: 'Gas Cylinder', amount: 850, category: 'gas', paidBy: charan._id, splitType: 'equal' },
      { title: 'Vegetables', amount: 600, category: 'vegetables', paidBy: rahul._id, splitType: 'equal' },
      { title: 'Milk - Monthly', amount: 900, category: 'milk', paidBy: kiran._id, splitType: 'quantity' },
      { title: 'Water Bottles', amount: 300, category: 'water', paidBy: charan._id, splitType: 'equal' },
      { title: 'Cleaning Supplies', amount: 450, category: 'cleaning', paidBy: rahul._id, splitType: 'equal' },
    ];

    const members = [charan, rahul, kiran];

    for (const expData of expenses) {
      const expense = await Expense.create({
        ...expData,
        groupId: group._id,
        date: new Date(),
        monthKey,
        createdBy: expData.paidBy,
      });

      // Create equal splits
      const perPerson = Math.round((expData.amount / 3) * 100) / 100;
      await ExpenseSplit.create(
        members.map((m, i) => ({
          expenseId: expense._id,
          userId: m._id,
          amount: i === 2 ? expData.amount - perPerson * 2 : perPerson, // Handle rounding
        }))
      );
    }

    console.log('💰 Created', expenses.length, 'sample expenses');

    // Create a settlement
    await Settlement.create({
      groupId: group._id,
      paidBy: rahul._id,
      paidTo: charan._id,
      amount: 500,
      date: new Date(),
      notes: 'Settling last week\'s grocery share',
      monthKey,
    });

    console.log('🤝 Created sample settlement');

    console.log('\n✅ Seed complete! Use these credentials to login:');
    console.log('─────────────────────────────────────────');
    console.log('Super Admin:  admin@roomexpense.app / Admin@123456');
    console.log('Charan:       charan@example.com / password123');
    console.log('Rahul:        rahul@example.com / password123');
    console.log('Kiran:        kiran@example.com / password123');
    console.log('─────────────────────────────────────────');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
