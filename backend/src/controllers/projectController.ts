import { Router } from 'express';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/auth';
import { authMiddleware } from '../middleware/auth';
import { handleError, requireAuth, validateUUID } from '../middleware/errorHandler';
import { requireProjectAccess, requireProjectRole, requireTeamAccess, requireTeamRole } from '../services/authorization';
import {
  getUserProjects,
  getTeamProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  updateProjectMember,
  removeProjectMember,
  transferProjectOwnership,
} from '../services/projectService';
import { ProjectCreateSchema, ProjectUpdateSchema, AddMemberSchema, UpdateMemberSchema, TransferOwnershipSchema } from '../models/validation';

const router = Router();

/**
 * @route GET /api/projects
 * @desc List all projects the user has access to (owned + member + team)
 * @access Private
 */
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = requireAuth(req);
    const { team_id, status } = req.query;
    
    let projects;
    if (team_id && typeof team_id === 'string') {
      // Validate team access
      validateUUID(team_id);
      await requireTeamAccess(team_id, user.id);
      projects = await getTeamProjects(team_id, status as string | undefined);
    } else {
      projects = await getUserProjects(user.id, status as string | undefined);
    }
    
    res.json({
      success: true,
      data: projects,
      count: projects.length,
    });
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * @route POST /api/projects
 * @desc Create a new project
 * @access Private
 */
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = requireAuth(req);
    const data = ProjectCreateSchema.parse(req.body);
    
    // If team_id provided, verify user has access to create projects in team
    if (data.team_id) {
      await requireTeamRole(data.team_id, user.id, 'member');
    }
    
    const project = await createProject(data, user.id);
    res.status(201).json({
      success: true,
      data: project,
      message: 'Project created successfully',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: err.errors[0].message,
        code: 'VALIDATION_ERROR',
        details: err.errors,
      });
      return;
    }
    handleError(err, res);
  }
});

/**
 * @route GET /api/projects/:id
 * @desc Get project details with members
 * @access Private
 */
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = requireAuth(req);
    const projectId = req.params.id;
    validateUUID(projectId);

    await requireProjectAccess(projectId, user.id);
    const project = await getProjectById(projectId, user.id);
    
    res.json({
      success: true,
      data: project,
    });
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * @route PUT /api/projects/:id
 * @desc Update project details
 * @access Private (Admin+)
 */
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = requireAuth(req);
    const projectId = req.params.id;
    validateUUID(projectId);

    await requireProjectRole(projectId, user.id, 'admin');
    const data = ProjectUpdateSchema.parse(req.body);
    
    // If changing team, verify access to both teams
    if (data.team_id !== undefined) {
      if (data.team_id) {
        await requireTeamRole(data.team_id, user.id, 'member');
      }
      // Verify user can manage team settings
      await requireProjectRole(projectId, user.id, 'admin');
    }
    
    const project = await updateProject(projectId, data);
    res.json({
      success: true,
      data: project,
      message: 'Project updated successfully',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: err.errors[0].message,
        code: 'VALIDATION_ERROR',
        details: err.errors,
      });
      return;
    }
    handleError(err, res);
  }
});

/**
 * @route DELETE /api/projects/:id
 * @desc Delete a project permanently
 * @access Private (Owner only)
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = requireAuth(req);
    const projectId = req.params.id;
    validateUUID(projectId);

    // Only owner can delete
    await requireProjectRole(projectId, user.id, 'owner');
    await deleteProject(projectId);
    
    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * @route POST /api/projects/:id/members
 * @desc Add a member to the project
 * @access Private (Admin+)
 */
router.post('/:id/members', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = requireAuth(req);
    const projectId = req.params.id;
    validateUUID(projectId);

    await requireProjectRole(projectId, user.id, 'admin');
    const data = AddMemberSchema.parse(req.body);
    
    const member = await addProjectMember(projectId, data.user_id, data.role);
    res.status(201).json({
      success: true,
      data: member,
      message: 'Member added successfully',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: err.errors[0].message,
        code: 'VALIDATION_ERROR',
        details: err.errors,
      });
      return;
    }
    handleError(err, res);
  }
});

/**
 * @route PUT /api/projects/:id/members/:userId
 * @desc Update a member's role
 * @access Private (Admin+)
 */
router.put('/:id/members/:userId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = requireAuth(req);
    const projectId = req.params.id;
    const memberUserId = req.params.userId;
    validateUUID(projectId);
    validateUUID(memberUserId);

    await requireProjectRole(projectId, user.id, 'admin');
    const data = UpdateMemberSchema.parse(req.body);
    
    // Prevent self-demotion if owner
    if (user.id === memberUserId) {
      const { getUserProjectRole } = await import('../services/authorization');
      const currentRole = await getUserProjectRole(projectId, user.id);
      if (currentRole === 'owner' && data.role !== 'owner') {
        res.status(400).json({
          success: false,
          error: 'Cannot demote yourself as owner. Transfer ownership first.',
          code: 'SELF_DEMOTION_NOT_ALLOWED',
        });
        return;
      }
    }
    
    const member = await updateProjectMember(projectId, memberUserId, data.role);
    res.json({
      success: true,
      data: member,
      message: 'Member role updated successfully',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: err.errors[0].message,
        code: 'VALIDATION_ERROR',
        details: err.errors,
      });
      return;
    }
    handleError(err, res);
  }
});

/**
 * @route DELETE /api/projects/:id/members/:userId
 * @desc Remove a member from the project
 * @access Private (Admin+)
 */
router.delete('/:id/members/:userId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = requireAuth(req);
    const projectId = req.params.id;
    const memberUserId = req.params.userId;
    validateUUID(projectId);
    validateUUID(memberUserId);

    // Cannot remove yourself via this endpoint (use leave instead)
    if (user.id === memberUserId) {
      res.status(400).json({
        success: false,
        error: 'Use POST /api/projects/:id/leave to leave a project',
        code: 'USE_LEAVE_ENDPOINT',
      });
      return;
    }

    await requireProjectRole(projectId, user.id, 'admin');
    await removeProjectMember(projectId, memberUserId);
    
    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * @route POST /api/projects/:id/transfer-ownership
 * @desc Transfer project ownership to another member
 * @access Private (Owner only)
 */
router.post('/:id/transfer-ownership', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = requireAuth(req);
    const projectId = req.params.id;
    validateUUID(projectId);

    await requireProjectRole(projectId, user.id, 'owner');
    const data = TransferOwnershipSchema.parse(req.body);
    validateUUID(data.new_owner_id);
    
    const result = await transferProjectOwnership(projectId, user.id, data.new_owner_id);
    res.json({
      success: true,
      data: result,
      message: 'Ownership transferred successfully',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: err.errors[0].message,
        code: 'VALIDATION_ERROR',
        details: err.errors,
      });
      return;
    }
    handleError(err, res);
  }
});

/**
 * @route POST /api/projects/:id/leave
 * @desc Leave a project (for members)
 * @access Private
 */
router.post('/:id/leave', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = requireAuth(req);
    const projectId = req.params.id;
    validateUUID(projectId);

    // Check if user is owner
    const { getUserProjectRole } = await import('../services/authorization');
    const role = await getUserProjectRole(projectId, user.id);
    
    if (role === 'owner') {
      res.status(400).json({
        success: false,
        error: 'Owner cannot leave project. Transfer ownership first.',
        code: 'OWNER_CANNOT_LEAVE',
      });
      return;
    }

    await requireProjectAccess(projectId, user.id);
    await removeProjectMember(projectId, user.id);
    
    res.json({
      success: true,
      message: 'Left project successfully',
    });
  } catch (err) {
    handleError(err, res);
  }
});

export default router;
