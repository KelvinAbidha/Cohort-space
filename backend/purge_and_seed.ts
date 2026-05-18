import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

async function main() {
  console.log("--- IMPORTING DATA FROM EXCEL ---");

  // 1. Read Excel File
  const workbook = XLSX.readFile('../STQA_Task_Database.xlsx');
  const sheetNames = workbook.SheetNames;

  // Ensure STQA Unit exists
  const unit = await prisma.unit.upsert({
    where: { name: 'Software Quality Assurance' },
    update: {},
    create: { name: 'Software Quality Assurance' }
  });

  // Purge existing data
  console.log("Purging old data...");
  await prisma.task.deleteMany({});
  await prisma.milestone.deleteMany({});
  await prisma.resource.deleteMany({});
  await prisma.member.deleteMany({});
  await prisma.workspace.deleteMany({});

  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];
    // Skip row 0 (title), read headers from row 1
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    if (rawData.length <= 2) continue;

    const rows = rawData.slice(2);

    let groupName = sheetName; // default to sheet name
    for (const row of rows) {
       if (row[0]) {
           groupName = row[0];
           break;
       }
    }
    console.log(`Processing Group: ${groupName}`);

    // Create Workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: groupName,
        code: groupName.substring(0, 4).toUpperCase() + Math.floor(Math.random() * 1000),
        unitId: unit.id
      }
    });

    // Extract unique members
    const memberMap = new Map<string, number>(); // reg -> member ID
    for (const row of rows) {
      const name = row[1];
      const reg = row[2];
      if (!name || !reg) continue;

      if (!memberMap.has(reg)) {
        const user = await prisma.user.upsert({
          where: { regNumber: reg },
          update: { name },
          create: { name, regNumber: reg, pin: '1234' }
        });
        const member = await prisma.member.create({
          data: { userId: user.id, workspaceId: workspace.id }
        });
        memberMap.set(reg, member.id);
      }
    }

    // Create a couple of generic milestones for the workspace to look good
    const milestones = await Promise.all([
      prisma.milestone.create({ data: { title: 'Initial Planning & Design', dueDate: new Date('2026-03-30'), workspaceId: workspace.id } }),
      prisma.milestone.create({ data: { title: 'Development & Implementation', dueDate: new Date('2026-04-30'), workspaceId: workspace.id } }),
      prisma.milestone.create({ data: { title: 'Testing & Final Presentation', dueDate: new Date('2026-05-20'), workspaceId: workspace.id } }),
    ]);

    // Insert Tasks
    const taskData = [];
    for (const row of rows) {
      const taskTitle = row[3];
      const status = row[4];
      const priority = row[5];
      const dueDateStr = row[6];
      const reg = row[2];

      if (!taskTitle || !reg) continue;

      let dueDate = new Date();
      if (dueDateStr) {
          // Check if it's Excel date format (number) or string
          if (typeof dueDateStr === 'number') {
             dueDate = new Date(Math.round((dueDateStr - 25569) * 86400 * 1000));
          } else if (typeof dueDateStr === 'string') {
             // Handle "YYYY-MM-DD" or "DD/MM/YYYY" etc.
             const parts = dueDateStr.split(/[-/]/);
             if (parts.length === 3) {
                if (parts[0].length === 4) {
                   dueDate = new Date(dueDateStr);
                } else {
                   // Assume DD/MM/YYYY
                   dueDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                }
             } else {
                dueDate = new Date(dueDateStr);
             }
          }
      }

      // Assign to milestone based on date
      let milestoneId = milestones[1].id; // default
      if (dueDate < new Date('2026-04-01')) milestoneId = milestones[0].id;
      else if (dueDate > new Date('2026-05-01')) milestoneId = milestones[2].id;

      taskData.push({
        title: taskTitle,
        status: status || 'To Do',
        priority: priority || 'Medium',
        dueDate: isNaN(dueDate.getTime()) ? null : dueDate,
        assigneeId: memberMap.get(reg),
        milestoneId: milestoneId,
        workspaceId: workspace.id
      });
    }

    if (taskData.length > 0) {
      await prisma.task.createMany({ data: taskData });
    }
  }

  console.log("--- DATA IMPORT COMPLETE! ---");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
