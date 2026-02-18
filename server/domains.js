/**
 * Vercel Custom Domain Configuration
 * Handles domain validation, configuration, and verification
 */

const VERCEL_API_BASE = 'https://api.vercel.com';

class DomainManager {
  constructor(token, teamId = null) {
    this.token = token;
    this.teamId = teamId;
  }

  async apiCall(endpoint, options = {}) {
    const url = new URL(`${VERCEL_API_BASE}${endpoint}`);
    if (this.teamId) url.searchParams.set('teamId', this.teamId);

    const res = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Vercel API error: ${res.status} - ${error}`);
    }

    return res.json();
  }

  /**
   * Check if a domain is available and get configuration info
   */
  async checkDomain(domain) {
    try {
      const result = await this.apiCall(`/v4/domains/${domain}`);
      return {
        available: !result.name,
        configured: !!result.name,
        verified: result.verified || false,
        verification: result.verification || null
      };
    } catch (err) {
      // Domain doesn't exist in Vercel yet (available to add)
      if (err.message.includes('404')) {
        return { available: true, configured: false, verified: false };
      }
      throw err;
    }
  }

  /**
   * Add domain to a Vercel project
   */
  async addDomainToProject(projectId, domain) {
    const result = await this.apiCall(`/v9/projects/${projectId}/domains`, {
      method: 'POST',
      body: JSON.stringify({ name: domain })
    });

    return {
      domain: result.name,
      verified: result.verified || false,
      verification: result.verification || null,
      redirect: result.redirect || null
    };
  }

  /**
   * Get domain verification records (DNS/CNAME)
   */
  async getDomainVerification(domain) {
    const result = await this.apiCall(`/v4/domains/${domain}/config`);
    return {
      aRecords: result.a || [],
      cnameRecords: result.cname || [],
      txtRecords: result.txt || [],
      nameservers: result.nameservers || [],
      verification: result.verification || null
    };
  }

  /**
   * Verify domain ownership
   */
  async verifyDomain(projectId, domain) {
    const result = await this.apiCall(`/v9/projects/${projectId}/domains/${domain}/verify`, {
      method: 'POST'
    });

    return {
      verified: result.verified || false,
      domain: result.name
    };
  }

  /**
   * Remove domain from project
   */
  async removeDomain(projectId, domain) {
    await this.apiCall(`/v9/projects/${projectId}/domains/${domain}`, {
      method: 'DELETE'
    });
    return { removed: true };
  }

  /**
   * Get DNS records needed for domain configuration
   */
  getDNSInstructions(domain, verificationType = 'cname') {
    const apexDomain = domain.replace(/^www\./, '');
    
    if (verificationType === 'cname') {
      return {
        type: 'CNAME',
        records: [
          { name: domain, value: 'cname.vercel-dns.com', ttl: 60 }
        ]
      };
    }

    // A records for apex domains
    return {
      type: 'A',
      records: [
        { name: apexDomain, value: '76.76.21.21', ttl: 60 },
        { name: apexDomain, value: '76.76.21.93', ttl: 60 }
      ]
    };
  }

  /**
   * Full domain setup flow
   */
  async configureDomain(projectId, domain) {
    const check = await this.checkDomain(domain);
    
    if (check.configured && check.verified) {
      return {
        success: true,
        domain,
        status: 'active',
        message: 'Domain is already configured and verified'
      };
    }

    // Add domain to project
    const added = await this.addDomainToProject(projectId, domain);
    
    // Get DNS instructions
    const isApex = !domain.startsWith('www.');
    const dns = this.getDNSInstructions(domain, isApex ? 'a' : 'cname');

    return {
      success: true,
      domain,
      status: added.verified ? 'active' : 'pending',
      verification: added.verification,
      dns,
      message: added.verified 
        ? 'Domain configured and verified' 
        : 'Domain added. Configure DNS records to complete setup.'
    };
  }
}

module.exports = { DomainManager };
