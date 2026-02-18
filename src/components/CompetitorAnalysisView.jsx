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
      <div className="flex gap-2 border-b border-[#222] pb-2">
        {[
          { key: 'overview', label: 'Market', icon: '🌍' },
          { key: 'competitors', label: 'Competitors', icon: '🏢' },
          { key: 'matrix', label: 'Comparison', icon: '📊' },
          { key: 'opportunities', label: 'Opportunities', icon: '💎' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === tab.key 
                ? 'bg-blue-900/30 text-blue-400 border border-blue-800/50' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
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
            <div className="p-4 bg-[#111] border border-[#222] rounded-lg">
              <span className="text-xs text-gray-500 uppercase">Market Size</span>
              <p className="text-lg font-medium text-white mt-1">{market_overview.size}</p>
            </div>
            <div className="p-4 bg-[#111] border border-[#222] rounded-lg">
              <span className="text-xs text-gray-500 uppercase">Growth Rate</span>
              <p className="text-lg font-medium text-white mt-1">{market_overview.growth_rate}</p>
            </div>
          </div>
          
          {market_overview.key_trends && (
            <div className="p-4 bg-[#111] border border-[#222] rounded-lg">
              <span className="text-xs text-gray-500 uppercase">Key Trends</span>
              <ul className="mt-3 space-y-2">
                {market_overview.key_trends.map((trend, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-blue-500">→</span>
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
            <div key={idx} className="border border-[#222] rounded-lg overflow-hidden bg-[#111]">
              <button
                onClick={() => toggleCompetitor(idx)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1a1a1a] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">🏢</span>
                  <div className="text-left">
                    <span className="font-medium text-white">{comp.name}</span>
                    {comp.website && (
                      <a 
                        href={comp.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block text-xs text-blue-400 hover:underline"
                        onClick={e => e.stopPropagation()}
                      >
                        {comp.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {comp.pricing?.starting_price && (
                    <span className="text-xs text-gray-500">From {comp.pricing.starting_price}</span>
                  )}
                  <span className={`transition-transform ${expandedCompetitor === idx ? 'rotate-180' : ''}`}>▾</span>
                </div>
              </button>
              
              {expandedCompetitor === idx && (
                <div className="px-4 pb-4 border-t border-[#222]">
                  <div className="grid grid-cols-2 gap-4 py-3 text-sm">
                    {comp.founded && (
                      <div>
                        <span className="text-gray-500">Founded:</span>
                        <span className="text-gray-300 ml-2">{comp.founded}</span>
                      </div>
                    )}
                    {comp.funding && (
                      <div>
                        <span className="text-gray-500">Funding:</span>
                        <span className="text-gray-300 ml-2">{comp.funding}</span>
                      </div>
                    )}
                    {comp.headquarters && (
                      <div>
                        <span className="text-gray-500">HQ:</span>
                        <span className="text-gray-300 ml-2">{comp.headquarters}</span>
                      </div>
                    )}
                    {comp.target_audience && (
                      <div>
                        <span className="text-gray-500">Target:</span>
                        <span className="text-gray-300 ml-2">{comp.target_audience}</span>
                      </div>
                    )}
                  </div>

                  {comp.positioning && (
                    <div className="py-2">
                      <span className="text-xs text-gray-500 uppercase">Positioning</span>
                      <p className="text-sm text-gray-300 mt-1">{comp.positioning}</p>
                    </div>
                  )}

                  {comp.key_features && (
                    <div className="py-2">
                      <span className="text-xs text-gray-500 uppercase">Key Features</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {comp.key_features.map((feat, i) => (
                          <span key={i} className="px-2 py-1 text-xs bg-white/5 text-gray-400 rounded">{feat}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {comp.pricing && (
                    <div className="py-2">
                      <span className="text-xs text-gray-500 uppercase">Pricing</span>
                      <p className="text-sm text-gray-300 mt-1">
                        <span className="text-gray-400">{comp.pricing.model}</span>
                        {comp.pricing.details && <span className="text-gray-500"> — {comp.pricing.details}</span>}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 py-2">
                    {comp.strengths && (
                      <div>
                        <span className="text-xs text-green-500 uppercase">Strengths</span>
                        <ul className="mt-2 space-y-1">
                          {comp.strengths.map((s, i) => (
                            <li key={i} className="text-xs text-gray-400 flex items-start gap-1">
                              <span className="text-green-500">+</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {comp.weaknesses && (
                      <div>
                        <span className="text-xs text-red-500 uppercase">Weaknesses</span>
                        <ul className="mt-2 space-y-1">
                          {comp.weaknesses.map((w, i) => (
                            <li key={i} className="text-xs text-gray-400 flex items-start gap-1">
                              <span className="text-red-500">−</span> {w}
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
              <tr className="border-b border-[#333]">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Feature</th>
                {comparison_matrix.rows?.map((row, i) => (
                  <th key={i} className="text-left py-2 px-3 text-gray-400 font-medium">{row.competitor}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison_matrix.features?.map((feature, fIdx) => (
                <tr key={fIdx} className="border-b border-[#222]">
                  <td className="py-2 px-3 text-gray-300">{feature}</td>
                  {comparison_matrix.rows?.map((row, rIdx) => {
                    const cell = row.cells?.find(c => c.feature === feature)
                    return (
                      <td key={rIdx} className="py-2 px-3">
                        {cell ? (
                          <span className={`${cell.advantage ? 'text-green-400' : 'text-gray-400'}`}>
                            {cell.value}
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
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
            <div className="p-4 bg-[#111] border border-[#222] rounded-lg">
              <span className="text-xs text-gray-500 uppercase">Market Gaps & Opportunities</span>
              <ul className="mt-3 space-y-3">
                {gaps_opportunities.map((gap, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                    <span className="text-yellow-500 mt-0.5">💡</span>
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {differentiation_strategy && (
            <div className="p-4 bg-blue-900/10 border border-blue-800/30 rounded-lg">
              <span className="text-xs text-blue-400 uppercase">Differentiation Strategy</span>
              <p className="text-sm text-gray-300 mt-3 leading-relaxed">{differentiation_strategy}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
