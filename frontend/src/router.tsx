/**
 * Enhanced Router Configuration
 * React Router setup with lazy loading, error boundaries, and nested routing
 */
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AppLayout } from './layouts/AppLayout';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { PageTransition } from './components/PageTransition';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AuthGuard } from './components/AuthGuard';
import { NotFoundPage } from './pages/NotFoundPage';

// Lazy load pages for code splitting
const ProjectListPage = lazy(() => 
  import('./pages/projects/ProjectListPage').then(m => ({ default: m.ProjectListPage }))
);
const ProjectDetailPage = lazy(() => 
  import('./pages/projects/ProjectDetailPage').then(m => ({ default: m.ProjectDetailPage }))
);
const TaskBoardPage = lazy(() => 
  import('./pages/tasks/TaskBoardPage').then(m => ({ default: m.TaskBoardPage }))
);
const ProjectSettingsPage = lazy(() => 
  import('./pages/projects/ProjectSettingsPage').then(m => ({ default: m.ProjectSettingsPage }))
);
const ProjectMembersPage = lazy(() => 
  import('./pages/projects/ProjectMembersPage').then(m => ({ default: m.ProjectMembersPage }))
);

// Wrapper component for lazy-loaded routes with transitions
function LazyRoute({ children }: { children: React.ReactNode }) {
  return (
    <PageTransition>
      <Suspense 
        fallback={
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        }
      >
        {children}
      </Suspense>
    </PageTransition>
  );
}

// Project layout with breadcrumb context
function ProjectLayout() {
  return (
    <div className="project-layout">
      <Outlet />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: <Navigate to="/projects" replace />,
      },
      {
        path: 'projects',
        handle: {
          crumb: () => ({ label: 'Projects', path: '/projects' }),
        },
        children: [
          {
            index: true,
            element: (
              <LazyRoute>
                <ProjectListPage />
              </LazyRoute>
            ),
          },
          {
            path: ':projectId',
            element: <ProjectLayout />,
            handle: {
              crumb: (params: { projectId: string }) => ({ 
                label: 'Project Details', 
                path: `/projects/${params.projectId}` 
              }),
            },
            children: [
              {
                index: true,
                element: (
                  <LazyRoute>
                    <ProjectDetailPage />
                  </LazyRoute>
                ),
              },
              {
                path: 'board',
                handle: {
                  crumb: (params: { projectId: string }) => ({ 
                    label: 'Task Board', 
                    path: `/projects/${params.projectId}/board` 
                  }),
                },
                element: (
                  <LazyRoute>
                    <TaskBoardPage />
                  </LazyRoute>
                ),
              },
              {
                path: 'settings',
                handle: {
                  crumb: (params: { projectId: string }) => ({ 
                    label: 'Settings', 
                    path: `/projects/${params.projectId}/settings` 
                  }),
                },
                element: (
                  <LazyRoute>
                    <ProjectSettingsPage />
                  </LazyRoute>
                ),
              },
              {
                path: 'members',
                handle: {
                  crumb: (params: { projectId: string }) => ({ 
                    label: 'Members', 
                    path: `/projects/${params.projectId}/members` 
                  }),
                },
                element: (
                  <LazyRoute>
                    <ProjectMembersPage />
                  </LazyRoute>
                ),
              },
            ],
          },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

// Route configuration object for programmatic navigation
export const routes = {
  home: '/',
  projects: {
    list: '/projects',
    detail: (id: string) => `/projects/${id}`,
    board: (id: string) => `/projects/${id}/board`,
    settings: (id: string) => `/projects/${id}/settings`,
    members: (id: string) => `/projects/${id}/members`,
  },
} as const;

// Type-safe route parameter extraction
export type RouteParams = {
  projectId: string;
  taskId: string;
};

// Route metadata types
export interface RouteHandle {
  crumb?: (params: Record<string, string>) => { label: string; path: string };
  title?: string;
  requireAuth?: boolean;
  permissions?: string[];
}
