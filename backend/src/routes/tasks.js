import express from 'express';
import { supabase } from '../lib/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route PATCH /api/tasks/:id/status
 * @desc Update task status with position
 * @access Private
 */
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, position } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!status) {
      return res.status(400).json({ 
        error: 'Status is required',
        code: 'MISSING_STATUS'
      });
    }

    const validStatuses = ['todo', 'in-progress', 'review', 'done'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        code: 'INVALID_STATUS'
      });
    }

    // Verify task exists and user has access
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('id, project_id, owner_id, assignee_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingTask) {
      return res.status(404).json({ 
        error: 'Task not found',
        code: 'TASK_NOT_FOUND'
      });
    }

    // Check project membership
    const { data: membership, error: membershipError } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', existingTask.project_id)
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership) {
      return res.status(403).json({ 
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Build update data
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    if (position !== undefined) {
      updateData.position = position;
    }

    // Update task
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        owner:owner_id(id, email, display_name, avatar_url),
        assignee:assignee_id(id, email, display_name, avatar_url),
        project:project_id(id, name, slug)
      `)
      .single();

    if (updateError) {
      console.error('Task status update error:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update task status',
        code: 'UPDATE_FAILED'
      });
    }

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        project_id: existingTask.project_id,
        user_id: userId,
        action: 'task_status_changed',
        entity_type: 'task',
        entity_id: id,
        metadata: {
          previous_status: existingTask.status,
          new_status: status,
          task_title: updatedTask.title
        }
      });

    res.json({
      success: true,
      data: updatedTask,
      message: 'Task status updated successfully'
    });

  } catch (error) {
    console.error('Task status update error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * @route POST /api/tasks/bulk-status
 * @desc Bulk update task positions within a column
 * @access Private
 */
router.post('/bulk-status', authenticateToken, async (req, res) => {
  try {
    const { tasks } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        error: 'Tasks array is required',
        code: 'MISSING_TASKS'
      });
    }

    // Get project_id from first task to verify access
    const { data: firstTask } = await supabase
      .from('tasks')
      .select('project_id')
      .eq('id', tasks[0].id)
      .single();

    if (!firstTask) {
      return res.status(404).json({
        error: 'Task not found',
        code: 'TASK_NOT_FOUND'
      });
    }

    // Verify access
    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', firstTask.project_id)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Perform bulk update
    const updates = tasks.map(task => ({
      id: task.id,
      status: task.status,
      position: task.position,
      updated_at: new Date().toISOString()
    }));

    const { error: bulkError } = await supabase
      .from('tasks')
      .upsert(updates, { onConflict: 'id' });

    if (bulkError) {
      console.error('Bulk update error:', bulkError);
      return res.status(500).json({
        error: 'Failed to update task positions',
        code: 'BULK_UPDATE_FAILED'
      });
    }

    res.json({
      success: true,
      message: 'Task positions updated successfully'
    });

  } catch (error) {
    console.error('Bulk status update error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;
