import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 1. Individual User Login (Reg Number + PIN)
app.post('/api/auth/login', async (req, res) => {
  const { regNumber, pin } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { regNumber: regNumber.toUpperCase().trim() }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid Registration Number. Please check and try again.' });
    }

    if (user.pin !== pin) {
      return res.status(401).json({ success: false, message: 'Incorrect PIN. Please try again.' });
    }

    res.json({
      success: true,
      userId: user.id,
      name: user.name,
      regNumber: user.regNumber,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 1.5. User Registration
app.post('/api/auth/register', async (req, res) => {
  const { name, regNumber, pin } = req.body;
  try {
    const normalizedReg = regNumber.toUpperCase().trim();
    
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { regNumber: normalizedReg }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Registration Number already in use. Please login instead.' });
    }

    const user = await prisma.user.create({
      data: {
        name,
        regNumber: normalizedReg,
        pin
      }
    });

    res.json({
      success: true,
      userId: user.id,
      name: user.name,
      regNumber: user.regNumber,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal Server Error during registration' });
  }
});

// 1.7. Join Workspace by Code
app.post('/api/workspaces/join', async (req, res) => {
  const { userId, code } = req.body;
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { code: code.trim().toUpperCase() }
    });

    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Invalid Workspace Code. Please check and try again.' });
    }

    // Check if user is already a member
    const existingMember = await prisma.member.findFirst({
      where: {
        userId: parseInt(userId),
        workspaceId: workspace.id
      }
    });

    if (existingMember) {
      return res.status(400).json({ success: false, message: 'You are already a member of this workspace.' });
    }

    await prisma.member.create({
      data: {
        userId: parseInt(userId),
        workspaceId: workspace.id
      }
    });

    res.json({ success: true, workspaceId: workspace.id, workspaceName: workspace.name });
  } catch (error) {
    console.error('Join error:', error);
    res.status(500).json({ error: 'Internal Server Error joining workspace' });
  }
});

// 2. Fetch User Workspaces (Multi-workspace selector)
app.get('/api/users/:id/workspaces', async (req, res) => {
    const userId = parseInt(req.params.id);
    try {
        const memberships = await prisma.member.findMany({
            where: { userId },
            include: {
                workspace: {
                    include: {
                        unit: true
                    }
                }
            }
        });
        
        // Group by Unit
        const grouped: Record<string, any[]> = {};
        memberships.forEach(m => {
            const unitName = m.workspace.unit.name;
            if (!grouped[unitName]) grouped[unitName] = [];
            grouped[unitName].push({
                workspaceId: m.workspace.id,
                workspaceName: m.workspace.name,
                code: m.workspace.code,
                unitName: unitName,
                memberId: m.id // Important for identifying the member role in that group
            });
        });
        
        res.json(grouped);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 3. Dashboard Aggregates (Standard)
app.get('/api/dashboard', async (req, res) => {
  const workspaceId = parseInt(req.query.workspaceId as string);
  try {
    const totalTasks = await prisma.task.count({ where: { workspaceId } });
    const openTasks = await prisma.task.count({ where: { workspaceId, status: { not: 'Done' } } });
    const doneTasks = await prisma.task.count({ where: { workspaceId, status: 'Done' } });
    
    const now = new Date();
    
    // Fetch future milestones
    const milestones = await prisma.milestone.findMany({
      where: { workspaceId, dueDate: { gte: now } },
      orderBy: { dueDate: 'asc' }
    });

    // Fetch future tasks with deadlines
    const tasksWithDeadlines = await prisma.task.findMany({
      where: { 
        workspaceId, 
        dueDate: { gte: now },
        status: { not: 'Done' }
      },
      orderBy: { dueDate: 'asc' }
    });

    // Combine and sort by date
    const deadlines = [
      ...milestones.map(m => ({ ...m, type: 'milestone' })),
      ...tasksWithDeadlines.map(t => ({ ...t, type: 'task' }))
    ].sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

    const membersCount = await prisma.member.count({ where: { workspaceId } });
    const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    
    res.json({
      openTasks,
      totalTasks,
      milestonesDue: deadlines.length,
      completionRate,
      activeMembers: membersCount,
      upcomingDeadlines: deadlines.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. Member Contributions
app.get('/api/members/contributions', async (req, res) => {
  const workspaceId = parseInt(req.query.workspaceId as string);
  try {
    const members = await prisma.member.findMany({
      where: { workspaceId },
      include: {
        user: true,
        tasks: {
          select: { status: true }
        }
      }
    });
    
    const contributions = members.map((m) => ({
      name: m.user.name,
      completed: m.tasks.filter((t: { status: string }) => t.status === 'Done').length,
      total: m.tasks.length
    }));
    
    res.json(contributions);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 5. Tasks CRUD
app.get('/api/resources', async (req, res) => {
  const workspaceId = parseInt(req.query.workspaceId as string);
  try {
    const resources = await prisma.resource.findMany({
      where: { workspaceId },
      include: { uploadedBy: { include: { user: true } } }
    });
    const flattened = resources.map((r: any) => ({
        ...r,
        uploadedBy: r.uploadedBy ? { name: r.uploadedBy.user.name } : { name: 'Unknown' }
    }));
    res.json(flattened);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/resources', async (req, res) => {
  const { title, url, type, uploadedById, workspaceId } = req.body;
  try {
    const resource = await prisma.resource.create({
      data: {
        title,
        url,
        type,
        uploadedById: parseInt(uploadedById),
        workspaceId: parseInt(workspaceId)
      }
    });
    res.json(resource);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/resources/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.resource.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/tasks', async (req, res) => {
  const workspaceId = parseInt(req.query.workspaceId as string);
  try {
    const tasks = await prisma.task.findMany({
      where: { workspaceId },
      include: { 
          assignee: { include: { user: true } }, 
          milestone: true 
      }
    });
    // Flatten assignee user name
    const flattened = tasks.map((t: any) => ({
        ...t,
        assignee: t.assignee && t.assignee.user ? { name: t.assignee.user.name } : null
    }));
    res.json(flattened);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/tasks', async (req, res) => {
  const { title, status, assigneeId, milestoneId, workspaceId, dueDate, priority } = req.body;
  try {
    const task = await prisma.task.create({
      data: {
        title,
        status: status || 'To Do',
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        milestoneId: milestoneId ? parseInt(milestoneId) : null,
        workspaceId: parseInt(workspaceId),
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'Medium'
      }
    });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { title, status, assigneeId, milestoneId, dueDate, priority } = req.body;
  try {
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId ? parseInt(assigneeId) : null;
    if (milestoneId !== undefined) updateData.milestoneId = milestoneId ? parseInt(milestoneId) : null;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    const task = await prisma.task.update({
      where: { id },
      data: updateData
    });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.task.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 6. Workspace Management
app.get('/api/units', async (req, res) => {
  try {
    const units = await prisma.unit.findMany();
    res.json(units);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/workspaces', async (req, res) => {
  const { unitId, groupNumber, userId } = req.body;
  try {
    const unit = await prisma.unit.findUnique({ where: { id: parseInt(unitId) } });
    if (!unit) return res.status(404).json({ error: 'Unit not found' });

    // Auto-naming logic: CIT 2313: Software Quality Assurance -> Prefix is "CIT 2313"
    const prefix = unit.name.includes(':') ? unit.name.split(':')[0].trim() : unit.name.split(' ').slice(0, 2).join(' ');
    const workspaceName = `${prefix} - Group ${groupNumber}`;
    const workspaceCode = `${prefix.replace(/\s+/g, '')}-GP${groupNumber}`.toUpperCase();

    // Check if exists
    const existing = await prisma.workspace.findFirst({
        where: { OR: [{ name: workspaceName }, { code: workspaceCode }] }
    });

    if (existing) {
        return res.status(400).json({ success: false, message: `Group ${groupNumber} already exists for this unit.` });
    }

    const workspace = await prisma.workspace.create({
      data: {
        name: workspaceName,
        code: workspaceCode,
        unitId: parseInt(unitId),
        members: {
            create: {
                userId: parseInt(userId)
            }
        }
      },
      include: {
          members: true
      }
    });
    
    res.json({ success: true, workspaceId: workspace.id, workspaceName: workspace.name, memberId: workspace.members[0].id });
  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/workspaces/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        // Cascading deletes handled by DB/Prisma if defined, 
        // but for safety in SQLite we can just delete from here
        await prisma.workspace.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 7. Helper for meta
app.get('/api/meta', async (req, res) => {
    const workspaceId = parseInt(req.query.workspaceId as string);
    try {
        const members = await prisma.member.findMany({ 
            where: { workspaceId },
            include: { user: true }
        });
        const milestones = await prisma.milestone.findMany({ where: { workspaceId }});
        
        const flattenedMembers = members.map(m => ({ id: m.id, name: m.user.name }));
        res.json({ members: flattenedMembers, milestones });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
