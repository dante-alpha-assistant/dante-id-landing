const { execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function deployLandingPage(projectDir, projectName, deliverableId) {
  const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'landing';
  const repoName = slug + '-landing';
  
  try {
    // 1. Init git + push to GitHub
    const ghToken = process.env.GH_TOKEN;
    execSync('git init', { cwd: projectDir, stdio: 'pipe' });
    execSync('git add -A', { cwd: projectDir, stdio: 'pipe' });
    execSync('git commit -m "Initial landing page"', { cwd: projectDir, stdio: 'pipe', env: { ...process.env, GIT_AUTHOR_NAME: 'dante-id', GIT_AUTHOR_EMAIL: 'noreply@dante.id', GIT_COMMITTER_NAME: 'dante-id', GIT_COMMITTER_EMAIL: 'noreply@dante.id' } });
    
    // Create repo (may already exist)
    try {
      execSync(`gh repo create dante-alpha-assistant/${repoName} --public --source=. --push`, { cwd: projectDir, stdio: 'pipe', env: { ...process.env, GH_TOKEN: ghToken } });
    } catch (e) {
      // Repo might exist, try pushing anyway
      execSync(`git remote add origin https://${ghToken}@github.com/dante-alpha-assistant/${repoName}.git`, { cwd: projectDir, stdio: 'pipe' });
      execSync('git push -u origin main --force', { cwd: projectDir, stdio: 'pipe' });
    }
    
    console.log(`GitHub repo: dante-alpha-assistant/${repoName}`);
    
    // 2. Build the project
    execSync('npm install', { cwd: projectDir, stdio: 'pipe' });
    execSync('npm run build', { cwd: projectDir, stdio: 'pipe' });
    
    // 3. Deploy to Vercel
    const vercelToken = process.env.VERCEL_TOKEN;
    if (!vercelToken) {
      console.log('No VERCEL_TOKEN, skipping Vercel deploy');
      const githubUrl = `https://github.com/dante-alpha-assistant/${repoName}`;
      return { github_url: githubUrl, deploy_url: null };
    }
    
    // Deploy dist/ to Vercel
    const output = execSync(
      `vercel deploy dist/ --prod --yes --token ${vercelToken} --name ${repoName}`,
      { cwd: projectDir, stdio: 'pipe', encoding: 'utf8' }
    ).trim();
    
    // output is the deployment URL
    const deployUrl = output.split('\n').pop().trim();
    console.log(`Deployed to: ${deployUrl}`);
    
    return { 
      github_url: `https://github.com/dante-alpha-assistant/${repoName}`,
      deploy_url: deployUrl 
    };
  } catch (err) {
    console.error('Deploy error:', err.message);
    return { github_url: null, deploy_url: null };
  }
}

module.exports = { deployLandingPage };
