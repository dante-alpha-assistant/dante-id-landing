import { useState } from 'react'
import CopyButton from './CopyButton'

export default function CompetitorAnalysisView({ content }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedCompetitor, setExpandedCompetitor] = useState(null)
  
  if (!content) return null

  const { market_overview, competitors, comparison_matrix, gaps_opportunities, differentiation_strategy } = content

  const toggleCompetitor = (idx) => {
    setExpandedCompetitor(expandedCompetitor === idx ? null : idx)
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex justify-end">
        <CopyButton text={JSON.stringify(content, null, 2)} label="Copy All" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-md-outline-variant pb-2">
        {[
          { key: 'overview', label: 'Market', icon: '🌍' },
          { key: 'competitors', label: 'Competitors', icon: '🏢' },
          { key: 'matrix', label: 'Comparison', icon: '📊' },
          { key: 'opportunities', label: 'Opportunities', icon: '💎' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 text-sm rounded-full transition-all flex items-center gap-2 ${
              activeTab === tab.key 
                ? 'bg-md-secondary-container text-md-on-secondary-container font-medium' 
                : 'text-md-on-surface-variant hover:text-md-on-surface hover:bg-md-surface-variant'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Market Overview */}
      {activeTab === 'overview' && market_overview && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-md-surface-container rounded-md-lg shadow-sm">
              <span className="text-xs text-md-on-surface-variant uppercase">Market Size</span>
              <p className="text-lg font-medium text-md-on-surface mt-1">{market_overview.size}</p>
            </div>
            <div className="p-4 bg-md-surface-container rounded-md-lg shadow-sm">
              <span className="text-xs text-md-on-surface-variant uppercase">Growth Rate</span>
              <p className="text-lg font-medium text-md-on-surface mt-1">{market_overview.growth_rate}</p>
            </div>
          </div>
          
          {market_overview.key_trends && (
            <div className="p-4 bg-md-surface-container rounded-md-lg shadow-sm">
              <span className="text-xs text-md-on-surface-variant uppercase">Key Trends</span>
              <ul className="mt-3 space-y-2">
                {market_overview.key_trends.map((trend, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-md-on-surface">
                    <span className="text-md-primary">→</span>
                    {trend}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Competitors List */}
      {activeTab === 'competitors' && competitors && (
        <div className="space-y-3">
          {competitors.map((comp, idx) => (
            <div key={idx} className="bg-md-surface-container rounded-md-lg overflow-hidden shadow-sm">
              <button
                onClick={() => toggleCompetitor(idx)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-md-surface-variant/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">🏢</span>
                  <div className="text-left">
                    <span className="font-medium text-md-on-surface">{comp.name}</span>
                    {comp.website && (
                      <a 
                        href={comp.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block text-xs text-md-primary hover:underline"
                        onClick={e => e.stopPropagation()}
                      >
                        {comp.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {comp.pricing?.starting_price && (
                    <span className="text-xs text-md-on-surface-variant">From {comp.pricing.starting_price}</span>
                  )}
                  <span className={`transition-transform ${expandedCompetitor === idx ? 'rotate-180' : ''}`}>▾</span>
                </div>
              </button>
              
              {expandedCompetitor === idx && (
                <div className="px-4 pb-4 border-t border-md-outline-variant">
                  <div className="grid grid-cols-2 gap-4 py-3 text-sm">
                    {comp.founded && (
                      <div>
                        <span className="text-md-on-surface-variant">Founded:</span>
                        <span className="text-md-on-surface ml-2">{comp.founded}</span>
                      </div>
                    )}
                    {comp.funding && (
                      <div>
                        <span className="text-md-on-surface-variant">Funding:</span>
                        <span className="text-md-on-surface ml-2">{comp.funding}</span>
                      </div>
                    )}
                    {comp.headquarters && (
                      <div>
                        <span className="text-md-on-surface-variant">HQ:</span>
                        <span className="text-md-on-surface ml-2">{comp.headquarters}</span>
                      </div>
                    )}
                    {comp.target_audience && (
                      <div>
                        <span className="text-md-on-surface-variant">Target:</span>
                        <span className="text-md-on-surface ml-2">{comp.target_audience}</span>
                      </div>
                    )}
                  </div>

                  {comp.positioning && (
                    <div className="py-2">
                      <span className="text-xs text-md-on-surface-variant uppercase">Positioning</span>
                      <p className="text-sm text-md-on-surface mt-1">{comp.positioning}</p>
                    </div>
                  )}

                  {comp.key_features && (
                    <div className="py-2">
                      <span className="text-xs text-md-on-surface-variant uppercase">Key Features</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {comp.key_features.map((feat, i) => (
                          <span key={i} className="rounded-full bg-md-secondary-container text-md-on-secondary-container text-xs px-2 py-0.5">{feat}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {comp.pricing && (
                    <div className="py-2">
                      <span className="text-xs text-md-on-surface-variant uppercase">Pricing</span>
                      <p className="text-sm text-md-on-surface mt-1">
                        <span className="text-md-on-surface-variant">{comp.pricing.model}</span>
                        {comp.pricing.details && <span className="text-md-on-surface-variant"> — {comp.pricing.details}</span>}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 py-2">
                    {comp.strengths && (
                      <div>
                        <span className="text-xs text-emerald-600 uppercase">Strengths</span>
                        <ul className="mt-2 space-y-1">
                          {comp.strengths.map((s, i) => (
                            <li key={i} className="text-xs text-md-on-surface-variant flex items-start gap-1">
                              <span className="text-emerald-600">+</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {comp.weaknesses && (
                      <div>
                        <span className="text-xs text-md-error uppercase">Weaknesses</span>
                        <ul className="mt-2 space-y-1">
                          {comp.weaknesses.map((w, i) => (
                            <li key={i} className="text-xs text-md-on-surface-variant flex items-start gap-1">
                              <span className="text-md-error">−</span> {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Comparison Matrix */}
      {activeTab === 'matrix' && comparison_matrix && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-md-outline-variant">
                <th className="text-left py-2 px-3 text-md-on-surface-variant font-medium">Feature</th>
                {comparison_matrix.rows?.map((row, i) => (
                  <th key={i} className="text-left py-2 px-3 text-md-on-surface font-medium">{row.competitor}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison_matrix.features?.map((feature, fIdx) => (
                <tr key={fIdx} className="border-b border-md-outline-variant">
                  <td className="py-2 px-3 text-md-on-surface">{feature}</td>
                  {comparison_matrix.rows?.map((row, rIdx) => {
                    const cell = row.cells?.find(c => c.feature === feature)
                    return (
                      <td key={rIdx} className="py-2 px-3">
                        {cell ? (
                          <span className={`${cell.advantage ? 'text-emerald-600' : 'text-md-on-surface-variant'}`}>
                            {cell.value}
                          </span>
                        ) : (
                          <span className="text-md-on-surface-variant">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Opportunities */}
      {activeTab === 'opportunities' && (
        <div className="space-y-4">
          {gaps_opportunities && (
            <div className="p-4 bg-md-surface-container rounded-md-lg shadow-sm">
              <span className="text-xs text-md-on-surface-variant uppercase">Market Gaps & Opportunities</span>
              <ul className="mt-3 space-y-3">
                {gaps_opportunities.map((gap, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-md-on-surface">
                    <span className="text-md-tertiary mt-0.5">💡</span>
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {differentiation_strategy && (
            <div className="p-4 bg-md-primary-container rounded-md-lg">
              <span className="text-xs text-md-on-primary-container uppercase">Differentiation Strategy</span>
              <p className="text-sm text-md-on-primary-container mt-3 leading-relaxed">{differentiation_strategy}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
